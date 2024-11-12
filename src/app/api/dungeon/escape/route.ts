import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon, Item } from "@/app/models";
import mongoose from "mongoose";
import { calculateFailureXP } from "@/app/utils/xpCalculator";
import { handleDungeonItems } from "@/app/utils/dungeonItems";

// 탈출 페널티/보상 계산 함수
async function calculateEscapePenalties(dungeon: any, character: any) {
  const results = {
    goldPenalty: 0,
    savedItems: [] as any[],
    lostItems: [] as any[],
    xpReward: 0,
    preservedGold: 0,
  };

  // 1. 스테이지 진행도에 따른 보상/페널티 조정
  const progressRatio = dungeon.currentStage / dungeon.maxStages;

  // 2. 골드 페널티 계산 (진행도에 따라 감소)
  const basePenaltyRate = Math.max(0.05, 0.25 - progressRatio * 0.15);
  results.goldPenalty = Math.floor(character.gold * basePenaltyRate);

  // 3. 던전에서 획득한 골드 중 보존되는 골드 계산
  const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
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

  for (const tempItem of dungeon.temporaryInventory) {
    // 아이템 희귀도에 따른 추가 보존 확률
    let preservationChance = basePreservationChance;
    const item = await Item.findById(tempItem._id);

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
      results.savedItems.push(tempItem);
    } else {
      results.lostItems.push(tempItem);
    }
  }

  // 5. 경험치 보상 계산 (실패보다 약간 높은 보상)
  const baseFailureXP = calculateFailureXP(dungeon, character.level);
  results.xpReward = Math.floor(baseFailureXP * (0.6 + progressRatio * 0.4));

  return results;
}

export async function POST(req: NextRequest) {
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

    const dungeon = await Dungeon.findById(dungeonId);
    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    // 마지막 스테이지에서는 탈출 불가
    if (dungeon.currentStage === dungeon.maxStages - 1) {
      return NextResponse.json(
        { error: "Cannot escape from the final stage" },
        { status: 400 }
      );
    }

    // 탈출 불가능한 던전 체크
    if (!dungeon.canEscape) {
      return NextResponse.json(
        { error: "This dungeon does not allow escape" },
        { status: 400 }
      );
    }

    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 탈출 결과 계산
    const escapeResults = await calculateEscapePenalties(dungeon, character);

    // 최종 골드 계산 (보존된 골드 - 페널티)
    const finalGold = Math.max(
      0,
      escapeResults.preservedGold - escapeResults.goldPenalty
    );

    // 트랜잭션 시작
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
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
          },
          { session: dbSession }
        );

        // 캐릭터 상태 업데이트
        await Character.findByIdAndUpdate(
          characterId,
          {
            $inc: {
              xp: escapeResults.xpReward,
              gold: finalGold,
            },
          },
          { session: dbSession }
        );

        // 인벤토리 처리
        await handleDungeonItems(
          dungeon,
          character,
          "escape",
          dbSession,
          escapeResults.savedItems
        );
      });

      return NextResponse.json({
        success: true,
        message: "Successfully escaped from dungeon",
        rewards: {
          xp: escapeResults.xpReward,
          preservedGold: escapeResults.preservedGold,
          finalGold: finalGold,
        },
        penalties: {
          goldPenalty: escapeResults.goldPenalty,
          lostItems: escapeResults.lostItems.length,
        },
        savedItems: escapeResults.savedItems.length,
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          progressPercentage: Math.floor(
            (dungeon.currentStage / dungeon.maxStages) * 100
          ),
        },
      });
    } catch (transactionError) {
      console.error("Transaction error:", transactionError);
      return NextResponse.json(
        { error: "Failed to process dungeon escape" },
        { status: 500 }
      );
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error("Dungeon escape error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon escape" },
      { status: 500 }
    );
  }
}
