import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") || "5");

    // 캐릭터 ID 목록 가져오기
    const characters = await Character.find({
      userId: new Types.ObjectId(userId),
    })
      .select("_id")
      .lean();

    const characterIds = characters.map((char) => char._id);

    // 페이지네이션된 던전 활동 가져오기
    const skip = (page - 1) * pageSize;
    const dungeons = await Dungeon.find({
      characterId: { $in: characterIds },
      active: false,
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("characterId", "name profileImage")
      .select(
        "characterId dungeonName currentStage maxStages status completedAt rewards"
      )
      .lean();

    // 전체 던전 수 계산
    const totalDungeons = await Dungeon.countDocuments({
      characterId: { $in: characterIds },
      active: false,
    });

    console.log("totalDungeons", totalDungeons);

    const hasMore = totalDungeons > skip + pageSize;

    return NextResponse.json({
      activities: dungeons.map((dungeon) => ({
        _id: dungeon._id,
        characterName: (dungeon.characterId as any).name,
        characterProfileImage: (dungeon.characterId as any).profileImage,
        dungeonName: dungeon.dungeonName,
        currentStage: dungeon.currentStage,
        maxStages: dungeon.maxStages,
        status: dungeon.status,
        completedAt: dungeon.completedAt,
        rewards: dungeon.rewards,
      })),
      hasMore,
      total: totalDungeons,
      currentPage: page,
    });
  } catch (error) {
    console.error("Activities error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
