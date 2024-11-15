import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateCompletionXP } from "@/app/utils/xpCalculator";
import { handleDungeonItems } from "@/app/utils/dungeonItems";

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

    // 마지막 스테이지 확인
    if (dungeon.currentStage !== dungeon.maxStages - 1) {
      return NextResponse.json(
        { error: "Cannot complete dungeon before reaching final stage" },
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

    // 완료 보상 계산
    const completionXP = calculateCompletionXP(dungeon, character.level);

    // 미수령 골드 계산
    const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
      if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
        return total + log.data.rewards.gold;
      }
      return total;
    }, 0);

    // 완료 보너스 계산
    const bonusGold = Math.floor(
      unclaimedGold * 0.1 + // 기본 수집 골드의 10% 보너스
        dungeon.maxStages * 50 + // 스테이지당 50 골드
        (dungeon.recommendedLevel > character.level ? 200 : 100) // 높은 레벨 던전 추가 보너스
    );

    const totalGold = unclaimedGold + bonusGold;

    // 트랜잭션 시작
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // 던전 상태 업데이트
        await Dungeon.findByIdAndUpdate(
          dungeonId,
          {
            active: false,
            status: "completed",
            completedAt: new Date(),
            rewards: {
              xp: completionXP,
              gold: totalGold,
              bonusGold: bonusGold,
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
              experience: completionXP,
              gold: totalGold,
            },
          },
          { session: dbSession }
        );

        // 인벤토리 처리 (완료 시 모든 아이템 보존)
        await handleDungeonItems(dungeon, character, "complete", dbSession);
      });

      // 레벨업 체크를 위한 캐릭터 다시 조회
      const updatedCharacter = await Character.findById(characterId);
      const leveledUp = updatedCharacter?.level > character.level;

      return NextResponse.json({
        success: true,
        message: "Successfully completed dungeon",
        rewards: {
          xp: completionXP,
          gold: totalGold,
          breakdown: {
            baseGold: unclaimedGold,
            bonusGold: bonusGold,
          },
          items: dungeon.temporaryInventory.length,
        },
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          recommendedLevel: dungeon.recommendedLevel,
          playerLevel: character.level,
          leveledUp,
        },
      });
    } catch (transactionError) {
      console.error("Transaction error:", transactionError);
      return NextResponse.json(
        { error: "Failed to update dungeon and character status" },
        { status: 500 }
      );
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error("Dungeon completion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon completion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 던전 완료의 특징:
// 1. 모든 아이템 보존
// 2. 풍부한 보상 (기본 골드 + 보너스)
// 3. 레벨업 체크
