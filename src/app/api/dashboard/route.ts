import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Character,
  Dungeon,
  CharacterStatus,
  ICharacterStatus,
} from "@/app/models";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. 유저의 모든 캐릭터 가져오기
    const characters = await Character.find({
      userId: new Types.ObjectId(userId),
    })
      .select("name level class race hp resource profileImage")
      .lean();

    // 2. 각 캐릭터의 상태 정보 가져오기
    const characterStatuses = await Promise.all(
      characters.map(async (char) => {
        const status = await CharacterStatus.findOne({
          characterId: char._id,
        }).lean<ICharacterStatus>();

        // 활성 던전 정보 가져오기 (상태가 던전 활성인 경우)
        let activeDungeon = null;
        if (status?.status.dungeon.isActive) {
          activeDungeon = await Dungeon.findOne({
            characterId: char._id,
            active: true,
          })
            .select("dungeonName currentStage maxStages logs")
            .lean();
        }

        return {
          ...char,
          currentStatus: status?.status || {
            dungeon: { isActive: false },
            labor: { isActive: false },
          },
          activeDungeon,
        };
      })
    );

    // 3. 최근 완료된 던전들
    const recentDungeons = await Dungeon.find({
      characterId: { $in: characters.map((char) => char._id) },
      active: false,
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("characterId", "name")
      .select(
        "characterId dungeonName currentStage maxStages status completedAt rewards"
      )
      .lean();

    console.log("recentDungeons", recentDungeons);

    return NextResponse.json({
      characters: characterStatuses,
      recentActivity: recentDungeons.map((dungeon) => ({
        _id: dungeon._id,
        characterName: (dungeon.characterId as any).name,
        dungeonName: dungeon.dungeonName,
        currentStage: dungeon.currentStage,
        maxStages: dungeon.maxStages,
        status: dungeon.status,
        completedAt: dungeon.completedAt,
        rewards: dungeon.rewards,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
