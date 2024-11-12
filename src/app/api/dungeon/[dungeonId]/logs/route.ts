import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon, Item } from "@/app/models";
import { DungeonLog, Item as IItem } from "@/app/types";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { dungeonId: string } }
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const authSession = await getServerSession(authOptions);
    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId } = params;
    const { searchParams } = new URL(req.url);
    const logIndex = parseInt(searchParams.get("index") || "");

    if (isNaN(logIndex)) {
      return NextResponse.json(
        { error: "Log index is required" },
        { status: 400 }
      );
    }

    // 던전 찾기 및 권한 확인
    const dungeon = await Dungeon.findById(dungeonId).session(session);
    if (!dungeon || !dungeon.active) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    // 권한 확인
    const character = await Character.findById(dungeon.characterId);
    if (!character || character.userId.toString() !== authSession.user.id) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { error: "Not authorized to modify this dungeon" },
        { status: 403 }
      );
    }

    // 로그 인덱스 유효성 검사
    if (logIndex < 0 || logIndex >= dungeon.logs.length) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json({ error: "Invalid log index" }, { status: 400 });
    }

    // 첫 번째 로그는 삭제 불가
    if (logIndex === 0) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { error: "Cannot delete the initial log" },
        { status: 400 }
      );
    }

    // 삭제할 로그 가져오기
    const logToDelete = dungeon.logs[logIndex];

    // 해당 로그에서 획득한 아이템들의 ID 수집
    const itemIdsToDelete: string[] = [];
    if (logToDelete.data?.rewards?.items) {
      logToDelete.data.rewards.items.forEach((item: any) => {
        if (item._id) {
          itemIdsToDelete.push(item._id.toString());
        }
      });
    }

    // temporaryInventory에서 해당 로그의 아이템 제거
    if (logToDelete._id) {
      dungeon.temporaryInventory = dungeon.temporaryInventory.filter(
        (item: IItem) => item._id.toString() !== logToDelete._id.toString()
      );
    }

    // 캐릭터 인벤토리에서 해당 아이템들 제거
    if (itemIdsToDelete.length > 0) {
      await Character.updateOne(
        { _id: dungeon.characterId },
        { $pull: { inventory: { _id: { $in: itemIdsToDelete } } } },
        { session }
      );

      await Item.deleteMany({ _id: { $in: itemIdsToDelete } }, { session });
    }

    // 로그 삭제
    dungeon.logs.splice(logIndex);

    // 던전 상태 업데이트
    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        $set: {
          logs: dungeon.logs,
          temporaryInventory: dungeon.temporaryInventory,
        },
      },
      { new: true, session }
    ).populate("characterId");

    if (!updatedDungeon) {
      await session.abortTransaction();
      await session.endSession();
      return NextResponse.json(
        { error: "Failed to update dungeon" },
        { status: 500 }
      );
    }

    // 트랜잭션 커밋
    await session.commitTransaction();
    await session.endSession();

    // 클라이언트에 필요한 데이터만 반환
    return NextResponse.json({
      logs: updatedDungeon.logs,
      temporaryInventory: updatedDungeon.temporaryInventory,
    });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();

    console.error("Delete log error:", error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}
