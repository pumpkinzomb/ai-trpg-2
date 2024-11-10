import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon, Item } from "@/app/models";
import { TemporaryLoot } from "@/app/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { characterId, dungeonId } = await req.json();

    if (!characterId || !dungeonId) {
      return NextResponse.json(
        { error: "Character ID and Dungeon ID are required" },
        { status: 400 }
      );
    }

    // 던전 상태 확인
    const dungeon = await Dungeon.findById(dungeonId);
    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    // 마지막 스테이지에서는 탈출 불가
    if (dungeon.currentStage === dungeon.maxStages - 1) {
      return NextResponse.json(
        { error: "Cannot escape from the final stage" },
        { status: 400 }
      );
    }

    // 캐릭터 정보 조회
    const character = await Character.findById(characterId);
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 탈출 페널티 계산
    const escapeResults = await calculateEscapePenalties(dungeon, character);

    // 던전 상태 업데이트
    dungeon.active = false;
    await dungeon.save();

    // 캐릭터 상태 업데이트 (페널티 적용)
    character.gold = Math.max(0, character.gold - escapeResults.goldPenalty);
    await character.save();

    // 선별된 아이템만 인벤토리로 이동
    if (escapeResults.savedItems.length > 0) {
      await updateCharacterInventory(character, escapeResults.savedItems);
    }

    return NextResponse.json({
      success: true,
      message: "Successfully escaped from dungeon",
      penalties: {
        lostGold: escapeResults.goldPenalty,
        lostItems: escapeResults.lostItems,
        savedItems: escapeResults.savedItems,
      },
    });
  } catch (error) {
    console.error("Dungeon escape error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon escape" },
      { status: 500 }
    );
  }
}

// 탈출 페널티 계산 함수
export async function calculateEscapePenalties(dungeon: any, character: any) {
  const results = {
    goldPenalty: 0,
    savedItems: [] as TemporaryLoot[],
    lostItems: [] as TemporaryLoot[],
  };

  // 1. 골드 페널티 계산 (현재 소지금의 20%)
  results.goldPenalty = Math.floor(character.gold * 0.2);

  // 2. 아이템 보존/손실 계산
  for (const tempItem of dungeon.temporaryInventory) {
    // 각 아이템에 대해 50% 확률로 보존
    if (Math.random() < 0.5) {
      results.savedItems.push(tempItem);
    } else {
      results.lostItems.push(tempItem);
      // 손실된 아이템 삭제 또는 처리
      await Item.findByIdAndDelete(tempItem.itemId);
    }
  }

  return results;
}

// 캐릭터 인벤토리 업데이트 함수
async function updateCharacterInventory(
  character: any,
  savedItems: TemporaryLoot[]
) {
  const itemUpdates = savedItems.map(async (tempItem) => {
    const item = await Item.findById(tempItem.itemId);
    if (item) {
      item.ownerId = character._id;
      await item.save();
    }
  });

  await Promise.all(itemUpdates);
}
