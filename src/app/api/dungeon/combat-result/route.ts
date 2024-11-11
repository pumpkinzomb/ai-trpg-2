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
      dungeon.playerHP = 0;
      totalExperienceGain = Math.floor(
        (currentLog.data.rewards?.xp || 0) * 0.3
      );
      baseXP = totalExperienceGain;
      bonusXP = 0;
    }

    // 사용된 아이템 처리
    if (usedItems?.length > 0) {
      character.inventory = character.inventory.filter(
        (item: Item) =>
          !usedItems.some((usedItem) => usedItem.itemId === item._id.toString())
      );
    }

    // 캐릭터 업데이트
    character.experience += totalExperienceGain;
    await character.save();
    await dungeon.save();

    // 최종 던전 상태 조회
    const updatedDungeon = await Dungeon.findById(dungeonId)
      .populate("characterId")
      .populate("temporaryInventory.itemId");

    return NextResponse.json({
      success: true,
      message: victory ? "Combat victory" : "Combat defeat",
      dungeon: updatedDungeon,
      experienceGained: victory ? totalExperienceGain : 0,
      experienceBreakdown: victory
        ? {
            baseXP,
            bonusXP,
            total: totalExperienceGain,
          }
        : null,
    });
  } catch (error) {
    console.error("Combat result error:", error);
    return NextResponse.json(
      { error: "Failed to process combat result" },
      { status: 500 }
    );
  }
}
