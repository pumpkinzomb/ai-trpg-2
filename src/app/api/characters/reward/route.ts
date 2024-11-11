import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character } from "@/app/models";

interface RewardPayload {
  characterId: string;
  gold: number;
  experience?: number;
}

export async function POST(req: NextRequest) {
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
    const character = await Character.findById(characterId);
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

    // 레벨업 체크 로직 (예시: 1000 경험치당 레벨업)
    const expForLevelUp = character.level * 1000;
    if (character.experience >= expForLevelUp) {
      character.level += 1;
      character.experience -= expForLevelUp;
    }

    await character.save();

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
      levelUp: character.experience >= expForLevelUp,
    });
  } catch (error) {
    console.error("Character reward error:", error);
    return NextResponse.json(
      { error: "Failed to process reward" },
      { status: 500 }
    );
  }
}
