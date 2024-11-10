import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import { calculateEscapePenalties } from "../escape/route"; // 페널티 계산 함수 재사용

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

    // 던전 상태 확인
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

    // 탈출과 동일한 페널티 계산
    const penaltyResults = await calculateEscapePenalties(dungeon, character);

    // 던전 상태 업데이트
    dungeon.active = false;
    await dungeon.save();

    // 캐릭터 상태 업데이트 (페널티 적용)
    character.gold = Math.max(0, character.gold - penaltyResults.goldPenalty);
    await character.save();

    return NextResponse.json({
      success: true,
      message: "Dungeon failed",
      penalties: penaltyResults,
      redirectTo: "/worlds/temple", // 클라이언트에서 신전으로 리다이렉트하기 위한 정보
    });
  } catch (error) {
    console.error("Dungeon fail error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon failure" },
      { status: 500 }
    );
  }
}
