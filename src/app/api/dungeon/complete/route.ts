import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";

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

    // 던전 완료 처리
    dungeon.active = false;
    await dungeon.save();

    // 경험치 보상 계산 (던전 레벨과 스테이지 수에 따라)
    const completionXP = calculateCompletionXP(dungeon, character.level);

    // 캐릭터 경험치 업데이트
    character.xp += completionXP;
    await character.save();

    return NextResponse.json({
      success: true,
      message: "Successfully completed dungeon",
      rewards: {
        xp: completionXP,
      },
    });
  } catch (error) {
    console.error("Dungeon completion error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon completion" },
      { status: 500 }
    );
  }
}

// 던전 완료 경험치 계산 함수
function calculateCompletionXP(dungeon: any, characterLevel: number): number {
  // 기본 경험치
  const baseXP = 100;

  // 스테이지 수에 따른 보너스
  const stageBonus = dungeon.maxStages * 20;

  // 던전 레벨과 캐릭터 레벨 차이에 따른 보정
  const levelDiff = Math.max(
    -5,
    Math.min(5, dungeon.recommendedLevel - characterLevel)
  );
  const levelMultiplier = 1 + levelDiff * 0.1; // 레벨 차이당 10% 보정

  return Math.floor((baseXP + stageBonus) * levelMultiplier);
}
