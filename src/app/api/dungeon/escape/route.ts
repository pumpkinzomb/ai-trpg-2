import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon, Item, IItem } from "@/app/models";
import mongoose from "mongoose";
import { calculateFailureXP } from "@/app/utils/xpCalculator";
import { handleDungeonItems } from "@/app/utils/dungeonItems";
import { processCombatExperience } from "@/app/utils/character";
import { TemporaryLoot } from "@/app/types";

// 탈출 페널티/보상 계산 함수
async function calculateEscapePenalties(
  dungeonData: {
    currentStage: number;
    maxStages: number;
    logs: any[];
    temporaryInventory: TemporaryLoot[];
  },
  characterData: {
    gold: number;
    level: number;
  }
) {
  const results = {
    goldPenalty: 0,
    savedItems: [] as ({ name: string } & TemporaryLoot)[],
    lostItems: [] as ({ name: string } & TemporaryLoot)[],
    xpReward: 0,
    preservedGold: 0,
  };

  // 1. 스테이지 진행도에 따른 보상/페널티 조정
  const progressRatio = dungeonData.currentStage / dungeonData.maxStages;

  // 2. 골드 페널티 계산 (진행도에 따라 감소)
  const basePenaltyRate = Math.max(0.05, 0.25 - progressRatio * 0.15);
  results.goldPenalty = Math.floor(characterData.gold * basePenaltyRate);

  // 3. 던전에서 획득한 골드 중 보존되는 골드 계산
  const unclaimedGold = dungeonData.logs.reduce((total: number, log: any) => {
    if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
      return total + log.data.rewards.gold;
    }
    return total;
  }, 0);

  // 진행도에 따른 골드 보존율 (50%~90%)
  const goldPreservationRate = 0.5 + progressRatio * 0.4;
  results.preservedGold = Math.floor(unclaimedGold * goldPreservationRate);

  // 4. 아이템 보존/손실 계산 (진행도에 따라 보존 확률 증가)
  const basePreservationChance = 0.3 + progressRatio * 0.4; // 30%~70% 기본 확률

  for (const tempItem of dungeonData.temporaryInventory) {
    // 아이템 희귀도에 따른 추가 보존 확률
    let preservationChance = basePreservationChance;
    const item = await Item.findById(tempItem.itemId);

    if (item) {
      switch (item.rarity) {
        case "rare":
          preservationChance += 0.1;
          break;
        case "epic":
          preservationChance += 0.2;
          break;
        case "legendary":
          preservationChance += 0.3;
          break;
      }
    }

    if (Math.random() < preservationChance) {
      results.savedItems.push({ ...tempItem, name: item.name });
    } else {
      results.lostItems.push({ ...tempItem, name: item.name });
    }
  }

  // 5. 경험치 보상 계산 (실패보다 약간 높은 보상)
  const baseFailureXP = calculateFailureXP(dungeonData, characterData.level);
  results.xpReward = Math.floor(baseFailureXP * (0.6 + progressRatio * 0.4));

  return results;
}

export async function POST(req: NextRequest) {
  let mongoSession = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { characterId, dungeonId } = await req.json();

    if (!characterId || !dungeonId) {
      return NextResponse.json(
        { error: "Character ID and Dungeon ID are required" },
        { status: 400 }
      );
    }

    // Start transaction
    mongoSession = await mongoose.startSession();
    const result = await mongoSession.withTransaction(async (session) => {
      // Find documents within transaction
      const dungeon = await Dungeon.findById(dungeonId).session(session);
      const character = await Character.findById(characterId).session(session);

      if (!dungeon || !dungeon.active) {
        throw new Error("Active dungeon not found");
      }

      if (!character) {
        throw new Error("Character not found");
      }

      // 마지막 스테이지에서는 탈출 불가
      if (dungeon.currentStage === dungeon.maxStages - 1) {
        throw new Error("Cannot escape from the final stage");
      }

      // 탈출 불가능한 던전 체크
      if (!dungeon.canEscape) {
        throw new Error("This dungeon does not allow escape");
      }

      // 탈출 결과 계산
      const escapeResults = await calculateEscapePenalties(
        {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          logs: dungeon.logs.toObject ? dungeon.logs.toObject() : dungeon.logs,
          temporaryInventory: dungeon.temporaryInventory.map((item: IItem) =>
            item.toObject ? item.toObject() : item
          ),
        },
        {
          gold: character.gold,
          level: character.level,
        }
      );

      // 최종 골드 계산 (보존된 골드 - 페널티)
      const finalGold = Math.max(
        0,
        escapeResults.preservedGold - escapeResults.goldPenalty
      );

      // 캐릭터 경험치와 골드 업데이트
      character.experience += escapeResults.xpReward;
      character.gold += finalGold;
      await character.save({ session });

      // 레벨업 체크 및 처리
      const experienceResult = await processCombatExperience(
        character,
        session
      );

      // 던전 상태 업데이트
      await Dungeon.findByIdAndUpdate(
        dungeonId,
        {
          active: false,
          status: "escaped",
          completedAt: new Date(),
          rewards: {
            xp: escapeResults.xpReward,
            gold: finalGold,
          },
          "logs.$[].data.rewards.goldLooted": true,
          playerHP: 0,
        },
        { session }
      );

      // 인벤토리 처리
      await handleDungeonItems(
        dungeon,
        character,
        "escape",
        session,
        escapeResults.savedItems
      );

      return {
        success: true,
        message: "Successfully escaped from dungeon",
        rewards: {
          xp: escapeResults.xpReward,
          preservedGold: escapeResults.preservedGold,
          finalGold: finalGold,
        },
        penalties: {
          goldPenalty: escapeResults.goldPenalty,
          lostItems: escapeResults.lostItems,
        },
        savedItems: escapeResults.savedItems,
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          progressPercentage: Math.floor(
            (dungeon.currentStage / dungeon.maxStages) * 100
          ),
        },
        levelUp: experienceResult.levelUps
          ? {
              levelsGained: experienceResult.levelUps.length,
              details: experienceResult.levelUps,
              nextLevelXP: experienceResult.nextLevelXP,
            }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Dungeon escape error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon escape",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}
