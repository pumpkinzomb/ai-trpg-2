import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog } from "@/app/types";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, characterId, result } = await req.json();

    if (!dungeonId || !characterId || !result) {
      return NextResponse.json(
        { error: "dungeonId, characterId and result are required" },
        { status: 400 }
      );
    }

    const [dungeon, character] = await Promise.all([
      Dungeon.findById(dungeonId),
      Character.findById(characterId),
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

    // 현재 로그 가져오기
    const currentLog: DungeonLog = dungeon.logs[dungeon.logs.length - 1];
    if (!currentLog || !currentLog.data?.enemies) {
      return NextResponse.json(
        { error: "No active combat found" },
        { status: 400 }
      );
    }

    let baseXP = 0;
    let bonusXP = 0;
    let totalExperienceGain = 0;

    // 전투 결과 처리
    if (result.victory) {
      // 승리: 모든 적의 HP를 0으로 설정
      currentLog.data.enemies = currentLog.data.enemies.map((enemy) => ({
        ...enemy,
        hp: 0,
      }));

      baseXP = currentLog.data.rewards?.xp || 0;

      // 추가 경험치 계산
      bonusXP = currentLog.data.enemies.reduce((total, enemy) => {
        const levelDiff = Math.max(0, enemy.level - character.level);
        const bonus = levelDiff * 50;
        return total + bonus;
      }, 0);

      // 총 경험치 = 기본 XP + 보너스 XP
      totalExperienceGain = baseXP + bonusXP;

      // 던전 HP 업데이트
      dungeon.playerHP = result.remainingHp;
    } else {
      // 패배: 플레이어 HP를 0으로 설정
      dungeon.playerHP = 0;

      // 패배 시에도 기본 경험치의 30%를 획득
      totalExperienceGain = Math.floor(baseXP * 0.3);
      baseXP = totalExperienceGain; // 패배 시에는 기본 경험치만 적용
      bonusXP = 0; // 패배 시에는 보너스 경험치 없음
    }

    // 캐릭터 경험치 업데이트 (승패 상관없이)
    character.experience += totalExperienceGain;
    await character.save();

    // 변경사항 저장
    await dungeon.save();

    // 업데이트된 던전 정보 반환
    const updatedDungeon = await Dungeon.findById(dungeonId)
      .populate("characterId")
      .populate("temporaryInventory.itemId");

    return NextResponse.json({
      success: true,
      message: result.victory ? "Combat victory" : "Combat defeat",
      dungeon: updatedDungeon,
      experienceGained: result.victory ? totalExperienceGain : 0,
      experienceBreakdown: result.victory
        ? {
            baseXP,
            bonusXP,
            total: totalExperienceGain,
          }
        : null,
    });
  } catch (error) {
    console.error("Combat result error:", error);
    return NextResponse.json(
      { error: "Failed to process combat result" },
      { status: 500 }
    );
  }
}
