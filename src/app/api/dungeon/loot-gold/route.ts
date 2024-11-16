import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog } from "@/app/types";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dungeonId, logId } = body;

    if (!dungeonId || !logId) {
      return NextResponse.json(
        { error: "DungeonId and logId are required" },
        { status: 400 }
      );
    }

    // 던전 조회
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

    const log = dungeon.logs[logIndex];
    const goldAmount = log.data?.rewards?.gold || 0;

    if (goldAmount <= 0) {
      return NextResponse.json(
        { error: "No gold available in this log" },
        { status: 400 }
      );
    }

    // 이미 획득한 골드인지 확인
    if (log.data?.rewards?.goldLooted) {
      return NextResponse.json(
        { error: "Gold already looted" },
        { status: 400 }
      );
    }

    // 먼저 캐릭터 업데이트
    const character = await Character.findByIdAndUpdate(
      dungeon.characterId,
      {
        $inc: { gold: goldAmount },
      },
      {
        new: true,
        session: mongoSession,
        select: "-spells -arenaStats -proficiencies",
      }
    ).populate([
      "inventory",
      "equipment.weapon",
      "equipment.armor",
      "equipment.shield",
      "equipment.accessories",
    ]);

    // 그 다음 던전 업데이트
    const updatedDungeon = await Dungeon.findOneAndUpdate(
      {
        _id: dungeonId,
        "logs._id": logId,
      },
      {
        $set: {
          "logs.$.data.rewards.goldLooted": true,
          "logs.$.data.rewards.gold": 0,
          playerHP: character.hp.current,
        },
      },
      {
        new: true,
        session: mongoSession,
        runValidators: true,
      }
    );

    if (!updatedDungeon || !character) {
      throw new Error("Failed to update dungeon or character");
    }

    await mongoSession.commitTransaction();
    return NextResponse.json({
      ...updatedDungeon.toObject(),
      character,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Loot gold error:", error);
    return NextResponse.json({ error: "Failed to loot gold" }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
}
