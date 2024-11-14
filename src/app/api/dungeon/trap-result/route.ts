import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog } from "@/app/types";

interface TrapResult {
  success: boolean;
  roll: number;
  damage: number;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, logId, result } = (await req.json()) as {
      dungeonId: string;
      logId: string;
      result: TrapResult;
    };

    if (!dungeonId || !logId || !result) {
      return NextResponse.json(
        { error: "dungeonId, logId and result are required" },
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

    // 해당 로그 찾기
    const logIndex = dungeon.logs.findIndex(
      (log: DungeonLog) => log._id.toString() === logId
    );
    if (logIndex === -1) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const currentLog: DungeonLog = dungeon.logs[logIndex];
    if (!currentLog || !currentLog.data?.trap) {
      return NextResponse.json(
        { error: "No active trap found" },
        { status: 400 }
      );
    }

    const { success, roll, damage } = result;

    // 함정 결과 처리
    currentLog.data.trap.resolved = true;
    currentLog.data.trap.resolution = {
      success,
      roll,
      damage,
      description: success
        ? currentLog.data.trap.outcomes.success.description
        : currentLog.data.trap.outcomes.failure.description,
    };

    // HP 업데이트
    const newHP = Math.max(0, dungeon.playerHP - damage);
    dungeon.playerHP = newHP;

    // 로그 업데이트
    dungeon.logs[logIndex] = currentLog;

    await dungeon.save();

    // 최종 던전 상태 조회
    const updatedDungeon = await Dungeon.findById(dungeonId)
      .populate("characterId")
      .populate("temporaryInventory.itemId");

    return NextResponse.json({
      success: true,
      message: success ? "함정 회피 성공" : "함정 피해 발생",
      dungeon: updatedDungeon,
      trapResult: {
        success,
        roll,
        damage,
        description: success
          ? currentLog.data.trap.outcomes.success.description
          : currentLog.data.trap.outcomes.failure.description,
      },
    });
  } catch (error) {
    console.error("Trap result error:", error);
    return NextResponse.json(
      { error: "Failed to process trap result" },
      { status: 500 }
    );
  }
}
