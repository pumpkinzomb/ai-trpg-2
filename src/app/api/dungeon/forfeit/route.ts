import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character, Item } from "@/app/models";
import { TemporaryLoot } from "@/app/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dungeonId } = body;

    if (!dungeonId) {
      return NextResponse.json(
        { error: "DungeonId is required" },
        { status: 400 }
      );
    }

    // 던전과 캐릭터 정보 조회
    const dungeon = await Dungeon.findById(dungeonId).populate("characterId");

    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    // 임시 인벤토리에서 아이템 ID 추출
    const itemsToRemove = dungeon.temporaryInventory.map(
      (loot: TemporaryLoot) => loot.itemId
    );

    // 캐릭터의 인벤토리에서 해당 아이템들 제거
    await Character.findByIdAndUpdate(dungeon.characterId, {
      $pull: {
        inventory: { _id: { $in: itemsToRemove } },
      },
    });

    // 아이템 소유권 초기화
    await Item.updateMany(
      { _id: { $in: itemsToRemove } },
      {
        $set: {
          ownerId: null,
          previousOwnerId: dungeon.characterId,
        },
      }
    );

    // 던전 비활성화
    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        active: false,
        temporaryInventory: [], // 임시 인벤토리 초기화
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      removedItems: itemsToRemove.length,
      dungeon: updatedDungeon,
    });
  } catch (error) {
    console.error("Dungeon forfeit error:", error);
    return NextResponse.json(
      { error: "Failed to forfeit dungeon" },
      { status: 500 }
    );
  }
}
