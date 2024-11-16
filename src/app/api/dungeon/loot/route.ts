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

    // temporaryInventory가 없으면 빈 배열로 초기화
    const temporaryInventory = dungeon.temporaryInventory || [];

    // 이미 획득한 아이템인지 확인
    const alreadyLooted = temporaryInventory.some(
      (loot: TemporaryLoot) => loot.itemId === itemId
    );

    if (alreadyLooted) {
      return NextResponse.json(
        { error: "Item already looted" },
        { status: 400 }
      );
    }

    const itemObjectId = new mongoose.Types.ObjectId(itemId);
    const logObjectId = new mongoose.Types.ObjectId(logId);

    // 새로운 임시 인벤토리 아이템
    const newTemporaryItem = {
      itemId: itemObjectId,
      logId: logObjectId,
      timestamp: new Date(),
    };

    console.log("New temporary item to be added:", newTemporaryItem);

    // 업데이트 쿼리 수정
    const updateQuery = {
      $push: {
        temporaryInventory: {
          itemId: itemObjectId,
          logId: logObjectId,
          timestamp: new Date(),
        },
      },
    };

    // 업데이트 수행
    const character = await Character.findByIdAndUpdate(
      dungeon.characterId,
      {
        $push: { inventory: itemObjectId },
      },
      {
        new: true,
        session: mongoSession,
        runValidators: true,
        select: "-spells -arenaStats -proficiencies",
      }
    ).populate([
      "inventory",
      "equipment.weapon",
      "equipment.armor",
      "equipment.shield",
      "equipment.accessories",
    ]);

    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        ...updateQuery,
        $set: {
          playerHP: character.hp.current,
        },
      },
      {
        new: true,
        session: mongoSession,
        runValidators: true,
      }
    );

    if (!updatedDungeon) {
      throw new Error("Failed to update dungeon");
    }

    await mongoSession.commitTransaction();

    return NextResponse.json({
      ...updatedDungeon.toObject(),
      character,
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    console.error("Dungeon loot error:", error);
    return NextResponse.json({ error: "Failed to loot item" }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
}
