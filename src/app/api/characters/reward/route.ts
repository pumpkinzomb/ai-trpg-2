import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character } from "@/app/models";
import mongoose from "mongoose";
import { processCombatExperience } from "@/app/utils/character";

interface RewardPayload {
  characterId: string;
  gold: number;
  experience?: number;
}

export async function POST(req: NextRequest) {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RewardPayload;
    const { characterId, gold, experience = 0 } = body;

    if (!characterId || typeof gold !== "number") {
      return NextResponse.json(
        { error: "Character ID and gold amount are required" },
        { status: 400 }
      );
    }

    // 음수 값 체크
    if (gold < 0 || experience < 0) {
      return NextResponse.json(
        { error: "Reward amounts cannot be negative" },
        { status: 400 }
      );
    }

    // 캐릭터 확인
    const character = await Character.findById(characterId).session(
      mongoSession
    );
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 캐릭터 소유자 확인
    if (character.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this character" },
        { status: 403 }
      );
    }

    // 골드와 경험치 지급
    character.gold += gold;
    character.experience += experience;

    // 레벨업 체크 및 처리
    const experienceResult = await processCombatExperience(
      character,
      mongoSession
    );

    await mongoSession.commitTransaction();

    return NextResponse.json({
      success: true,
      message: `Successfully added ${gold} gold and ${experience} experience to character`,
      character: {
        id: character._id,
        name: character.name,
        gold: character.gold,
        level: character.level,
        experience: character.experience,
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
    console.error("Character reward error:", error);
    return NextResponse.json(
      { error: "Failed to process reward" },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}
