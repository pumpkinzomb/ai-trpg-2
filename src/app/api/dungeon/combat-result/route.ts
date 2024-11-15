import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog, Item, UsedItem } from "@/app/types";

interface CombatResult {
  victory: boolean;
  remainingHp: number;
  usedItems: UsedItem[];
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, characterId, result } = (await req.json()) as {
      dungeonId: string;
      characterId: string;
      result: CombatResult;
    };

    if (!dungeonId || !characterId || !result) {
      return NextResponse.json(
        { error: "dungeonId, characterId and result are required" },
        { status: 400 }
      );
    }

    const [dungeon, character] = await Promise.all([
      Dungeon.findById(dungeonId),
      Character.findById(characterId).populate<{ inventory: Item[] }>(
        "inventory"
      ),
    ]);

    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    const currentLog: DungeonLog = dungeon.logs[dungeon.logs.length - 1];
    if (!currentLog || !currentLog.data?.enemies) {
      return NextResponse.json(
        { error: "No active combat found" },
        { status: 400 }
      );
    }

    const { victory, remainingHp, usedItems } = result;

    let baseXP = 0;
    let bonusXP = 0;
    let totalExperienceGain = 0;

    console.log("usedItems", usedItems);

    // 전투 결과에 따른 적 HP 및 플레이어 HP 업데이트
    if (victory) {
      currentLog.data.enemies = currentLog.data.enemies.map((enemy) => ({
        ...enemy,
        hp: 0,
      }));
      baseXP = currentLog.data.rewards?.xp || 0;
      bonusXP = currentLog.data.enemies.reduce((total, enemy) => {
        const levelDiff = Math.max(0, enemy.level - character.level);
        return total + levelDiff * 50;
      }, 0);
      totalExperienceGain = baseXP + bonusXP;
      dungeon.playerHP = remainingHp;
    } else {
      // 패배 시 적 HP는 현재 상태 유지
      dungeon.playerHP = 0;
      totalExperienceGain = Math.floor(
        (currentLog.data.rewards?.xp || 0) * 0.3
      );
      baseXP = totalExperienceGain;
      bonusXP = 0;
    }

    // 전투 resolution 정보 업데이트
    if (!currentLog.data.combat) {
      currentLog.data.combat = {};
    }

    currentLog.data.combat.resolved = true;
    currentLog.data.combat.resolution = {
      victory,
      usedItems,
      experienceGained: victory ? totalExperienceGain : 0,
      remainingHp: victory ? remainingHp : 0,
    };

    // 사용된 아이템 처리
    if (usedItems?.length > 0) {
      const itemUsageCount = new Map<string, number>();

      // 각 아이템 ID별 사용 횟수 계산
      usedItems.forEach((usedItem) => {
        const count = itemUsageCount.get(usedItem.itemId) || 0;
        itemUsageCount.set(usedItem.itemId, count + 1);
      });

      const updatedInventory = character.inventory.reduce(
        (acc: Item[], item: Item) => {
          const usedCount = itemUsageCount.get(item._id.toString()) || 0;
          if (usedCount === 0) {
            // 사용되지 않은 아이템은 그대로 유지
            acc.push(item);
          }
          return acc;
        },
        []
      );

      character.inventory = updatedInventory;
    }

    // 캐릭터 업데이트
    character.experience += totalExperienceGain;

    console.log("check character", character);
    // 변경사항 저장
    const [savedCharacter, updatedDungeon] = await Promise.all([
      character
        .save()
        .select(
          "name level class race hp profileImage inventory experience gold"
        ),
      Dungeon.findByIdAndUpdate(
        dungeonId,
        {
          $set: {
            playerHP: dungeon.playerHP,
            logs: dungeon.logs,
          },
        },
        {
          new: true,
        }
      ).populate("temporaryInventory.itemId"),
    ]);

    return NextResponse.json({
      success: true,
      message: victory ? "Combat victory" : "Combat defeat",
      dungeon: {
        ...updatedDungeon.toObject(),
        character: savedCharacter,
      },
      experienceGained: totalExperienceGain,
      experienceBreakdown: {
        baseXP,
        bonusXP,
        total: totalExperienceGain,
      },
    });
  } catch (error) {
    console.error("Combat result error:", error);
    return NextResponse.json(
      { error: "Failed to process combat result" },
      { status: 500 }
    );
  }
}
