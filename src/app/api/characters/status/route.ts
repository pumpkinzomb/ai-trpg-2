import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, CharacterStatus, Dungeon } from "@/app/models";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 }
      );
    }

    // 캐릭터 확인
    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 활성화된 던전 찾기
    const activeDungeon = await Dungeon.findOne({
      characterId,
      active: true,
    });

    // 캐릭터 상태 확인
    let characterStatus = await CharacterStatus.findOne({
      characterId,
    }).lean();

    if (!characterStatus) {
      // 상태가 없다면 새로 생성
      characterStatus = await CharacterStatus.create({
        characterId,
        status: {
          dungeon: {
            isActive: !!activeDungeon,
          },
          labor: {
            isActive: false,
          },
        },
      });
    } else {
      // 던전 상태 업데이트 (기존 labor 상태는 유지)
      characterStatus = await CharacterStatus.findOneAndUpdate(
        { characterId },
        {
          $set: {
            "status.dungeon.isActive": !!activeDungeon,
            "status.dungeon.dungeonId": activeDungeon?._id || null,
          },
          lastUpdated: new Date(),
        },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      status: characterStatus,
    });
  } catch (error) {
    console.error("Character status check error:", error);
    return NextResponse.json(
      { error: "Failed to check character status" },
      { status: 500 }
    );
  }
}

// POST route for updating status
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { characterId, statusType, data } = body;

    if (!characterId || !statusType || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 던전 상태는 직접 변경 불가
    if (statusType === "dungeon") {
      return NextResponse.json(
        { error: "Cannot directly modify dungeon status" },
        { status: 400 }
      );
    }

    // 캐릭터 확인
    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 활성화된 던전 찾기 (상태 체크용)
    const activeDungeon = await Dungeon.findOne({
      characterId,
      active: true,
    });

    // 현재 캐릭터 상태 확인
    let characterStatus = await CharacterStatus.findOne({ characterId });
    if (!characterStatus) {
      characterStatus = await CharacterStatus.create({
        characterId,
        status: {
          dungeon: {
            isActive: !!activeDungeon,
          },
          labor: {
            isActive: false,
          },
        },
      });
    }

    // 상태 업데이트 (던전 상태는 유지)
    const updateData = {
      [`status.${statusType}`]: data,
      lastUpdated: new Date(),
    };

    const updatedStatus = await CharacterStatus.findOneAndUpdate(
      { characterId },
      { $set: updateData },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      status: updatedStatus,
    });
  } catch (error) {
    console.error("Character status update error:", error);
    return NextResponse.json(
      { error: "Failed to update character status" },
      { status: 500 }
    );
  }
}
