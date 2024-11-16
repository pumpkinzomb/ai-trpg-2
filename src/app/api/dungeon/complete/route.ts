import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateCompletionXP } from "@/app/utils/xpCalculator";
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

    if (dungeon.currentStage !== dungeon.maxStages - 1) {
      return NextResponse.json(
        { error: "Cannot complete dungeon before reaching final stage" },
        { status: 400 }
      );
    }

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
      unclaimedGold * 0.1 +
        dungeon.maxStages * 50 +
        (dungeon.recommendedLevel > character.level ? 200 : 100)
    );

    const totalGold = unclaimedGold + bonusGold;

    // 캐릭터 경험치 추가
    character.experience += completionXP;
    character.gold += totalGold;

    // 레벨업 처리
    const experienceResult = await processCombatExperience(
      character,
      mongoSession
    );

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
        playerHP: character.hp.current,
      },
      {
        new: true,
        session: mongoSession,
      }
    );

    // 인벤토리 처리
    await handleDungeonItems(dungeon, character, "complete", mongoSession);

    // 최종 캐릭터 상태 조회
    const savedCharacter = await Character.findById(character._id).session(
      mongoSession
    );

    await mongoSession.commitTransaction();

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
        playerLevel: savedCharacter.level,
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
    console.error("Dungeon completion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon completion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}
