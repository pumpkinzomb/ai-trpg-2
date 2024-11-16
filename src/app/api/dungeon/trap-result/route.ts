import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog } from "@/app/types";
import mongoose from "mongoose";
import { processCombatExperience } from "@/app/utils/character";

interface TrapResult {
  success: boolean;
  roll: number;
  damage: number;
}

export async function POST(req: NextRequest) {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, logId, result, characterId } = (await req.json()) as {
      dungeonId: string;
      characterId: string;
      logId: string;
      result: TrapResult;
    };

    if (!dungeonId || !logId || !characterId || !result) {
      return NextResponse.json(
        { error: "dungeonId, characterId, logId and result are required" },
        { status: 400 }
      );
    }

    const [dungeon, character] = await Promise.all([
      Dungeon.findById(dungeonId).session(mongoSession),
      Character.findById(characterId)
        .select("-spells -arenaStats -proficiencies")
        .populate([
          "inventory",
          "equipment.weapon",
          "equipment.armor",
          "equipment.shield",
          "equipment.accessories",
        ])
        .session(mongoSession),
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

    // 로그 업데이트
    dungeon.logs[logIndex] = currentLog;

    // 경험치 보상 (함정 난이도에 따라)
    const trapXP = success
      ? Math.floor(currentLog.data.trap.dc * 10) // 성공 시 더 많은 경험치
      : Math.floor(currentLog.data.trap.dc * 5); // 실패해도 약간의 경험치

    character.experience += trapXP;

    // 레벨업 체크 및 처리
    const experienceResult = await processCombatExperience(
      character,
      mongoSession
    );

    // HP 업데이트 - 레벨업으로 인한 HP 증가를 고려
    const newHP = Math.max(0, character.hp.current - damage);

    // 던전 업데이트
    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        $set: {
          playerHP: newHP,
          logs: dungeon.logs,
        },
      },
      {
        new: true,
        session: mongoSession,
      }
    );
    await mongoSession.commitTransaction();

    return NextResponse.json({
      success: true,
      message: success ? "함정 회피 성공" : "함정 피해 발생",
      dungeon: {
        ...updatedDungeon.toObject(),
        character,
      },
      trapResult: {
        success,
        roll,
        damage,
        description: success
          ? currentLog.data.trap.outcomes.success.description
          : currentLog.data.trap.outcomes.failure.description,
      },
      experienceGained: trapXP,
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
    console.error("Trap result error:", error);
    return NextResponse.json(
      { error: "Failed to process trap result" },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}
