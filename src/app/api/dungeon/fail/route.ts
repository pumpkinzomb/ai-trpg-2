import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateFailureXP } from "@/app/utils/xpCalculator";
import { handleDungeonItems } from "@/app/utils/dungeonItems";
import { processCombatExperience } from "@/app/utils/character";

export async function POST(req: NextRequest) {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

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

    const [dungeon, character] = await Promise.all([
      Dungeon.findById(dungeonId).session(mongoSession),
      Character.findById(characterId).session(mongoSession),
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

    // 실패 보상 계산
    const failureXP = calculateFailureXP(dungeon, character.level);

    // 미수령 골드 계산 (보존율 20%)
    const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
      if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
        return total + log.data.rewards.gold;
      }
      return total;
    }, 0);
    const preservedGold = Math.floor(unclaimedGold * 0.2);

    // 캐릭터 경험치와 골드 추가
    character.experience += failureXP;
    character.gold += preservedGold;
    character.hp.current = 0; // HP를 0으로 설정

    // 레벨업 체크 및 처리
    const experienceResult = await processCombatExperience(
      character,
      mongoSession
    );

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
        playerHP: 0,
      },
      { session: mongoSession }
    );

    // 인벤토리 처리 (실패 시 모든 아이템 손실)
    await handleDungeonItems(dungeon, character, "fail", mongoSession);

    await mongoSession.commitTransaction();

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
      lostItems: dungeon.temporaryInventory.length,
      status: {
        hp: 0,
        needsHealing: true,
      },
      levelUp: experienceResult.levelUps
        ? {
            levelsGained: experienceResult.levelUps.length,
            details: experienceResult.levelUps,
            nextLevelXP: experienceResult.nextLevelXP,
          }
        : null,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Dungeon fail error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon failure",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}
