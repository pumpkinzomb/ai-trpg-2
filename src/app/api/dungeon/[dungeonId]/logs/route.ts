import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import { DungeonLog } from "@/app/types";

export async function GET(
  req: NextRequest,
  { params }: { params: { dungeonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId } = params;
    if (!dungeonId) {
      return NextResponse.json(
        { error: "Dungeon ID is required" },
        { status: 400 }
      );
    }

    const dungeon = await Dungeon.findById(dungeonId);
    if (!dungeon) {
      return NextResponse.json({ error: "Dungeon not found" }, { status: 404 });
    }

    const character = await Character.findById(dungeon.characterId);
    if (!character || character.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Not authorized to view this dungeon" },
        { status: 403 }
      );
    }

    // 로그와 함께 필요한 정보만 반환
    return NextResponse.json({
      logs: dungeon.logs.map((log: DungeonLog) => ({
        type: log.type,
        description: log.description,
        image: log.image,
        data: log.data,
        timestamp: log.timestamp,
      })),
      status: dungeon.status,
      rewards: dungeon.status !== "active" ? dungeon.rewards : undefined,
    });
  } catch (error) {
    console.error("Failed to fetch dungeon logs:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch dungeon logs";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
