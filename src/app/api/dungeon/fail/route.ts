import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateFailureXP } from "@/app/utils/xpCalculator";
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

    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 실패 보상 계산
    const failureXP = calculateFailureXP(dungeon, character.level);

    // 미수령 골드 계산 (보존율 20%)
    const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
      if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
        return total + log.data.rewards.gold;
      }
      return total;
    }, 0);
    const preservedGold = Math.floor(unclaimedGold * 0.2); // 실패 시 20%만 보존

    // 트랜잭션 시작
    const dbSession = await mongoose.startSession();
    try {
      await dbSession.withTransaction(async () => {
        // 던전 상태 업데이트
        await Dungeon.findByIdAndUpdate(
          dungeonId,
          {
            active: false,
            status: "failed",
            completedAt: new Date(),
            rewards: {
              xp: failureXP,
              gold: preservedGold,
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
              xp: failureXP,
              gold: preservedGold,
            },
            "hp.current": 0, // HP를 0으로 설정
          },
          { session: dbSession }
        );

        // 인벤토리 처리 (실패 시 모든 아이템 손실)
        await handleDungeonItems(dungeon, character, "fail", dbSession);
      });

      return NextResponse.json({
        success: true,
        message: "Dungeon failed",
        rewards: {
          xp: failureXP,
          preservedGold,
        },
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          progressPercentage: Math.floor(
            (dungeon.currentStage / dungeon.maxStages) * 100
          ),
        },
        lostItems: dungeon.temporaryInventory.length, // 손실된 아이템 수
        status: {
          hp: 0,
          needsHealing: true,
        },
      });
    } catch (transactionError) {
      console.error("Transaction error:", transactionError);
      return NextResponse.json(
        { error: "Failed to process dungeon failure" },
        { status: 500 }
      );
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error("Dungeon fail error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon failure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// 실패 시 특징:
// 1. 모든 임시 아이템 손실
// 2. HP가 0이 됨
// 3. 미수령 골드의 20%만 보존
// 4. 진행도에 따른 경험치 보상
