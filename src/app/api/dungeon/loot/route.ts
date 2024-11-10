import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { TemporaryLoot } from "@/app/types";

export async function POST(req: NextRequest) {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dungeonId, itemId, logId } = body;

    if (!dungeonId || !itemId || !logId) {
      return NextResponse.json(
        { error: "DungeonId, itemId, and logId are required" },
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

    // 이미 획득한 아이템인지 확인
    const alreadyLooted = dungeon.temporaryInventory.some(
      (loot: TemporaryLoot) => loot.itemId === itemId
    );

    if (alreadyLooted) {
      return NextResponse.json(
        { error: "Item already looted" },
        { status: 400 }
      );
    }

    // temporaryInventory에 아이템 추가
    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        $push: {
          temporaryInventory: {
            itemId,
            logId,
            timestamp: new Date(),
          },
        },
      },
      { new: true, session: mongoSession }
    ).populate("characterId");

    if (updatedDungeon.characterId) {
      await Character.findByIdAndUpdate(
        updatedDungeon.characterId._id,
        {
          $push: { inventory: itemId },
        },
        { new: true, session: mongoSession }
      );
    }

    await mongoSession.commitTransaction();
    return NextResponse.json(updatedDungeon);
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Dungeon loot error:", error);
    return NextResponse.json({ error: "Failed to loot item" }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
}
