import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
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

    // 활성화된 던전 찾기
    const activeDungeon = await Dungeon.findOne({
      characterId,
      active: true,
    }).populate([
      {
        path: "characterId",
        select: "name level class race hp profileImage",
      },
    ]);

    return NextResponse.json({
      success: true,
      dungeon: activeDungeon,
    });
  } catch (error) {
    console.error("Active dungeon check error:", error);
    return NextResponse.json(
      { error: "Failed to check active dungeon" },
      { status: 500 }
    );
  }
}
