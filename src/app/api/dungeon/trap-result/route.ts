import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog } from "@/app/types";
import mongoose from "mongoose";
import { processCombatExperience } from "@/app/utils/character";

interface TrapResult {
  success: boolean;
  roll: number;
  damage: number;
}

export async function POST(req: NextRequest) {
  let mongoSession = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, logId, result, characterId } = (await req.json()) as {
      dungeonId: string;
      characterId: string;
      logId: string;
      result: TrapResult;
    };

    if (!dungeonId || !logId || !characterId || !result) {
      return NextResponse.json(
        { error: "dungeonId, characterId, logId and result are required" },
        { status: 400 }
      );
    }

    mongoSession = await mongoose.startSession();
    const transactionResult = await mongoSession.withTransaction(
      async (session) => {
        const dungeon = await Dungeon.findById(dungeonId).session(session);
        const character = await Character.findById(characterId)
          .select("-spells -arenaStats -proficiencies")
          .populate([
            "inventory",
            "equipment.weapon",
            "equipment.armor",
            "equipment.shield",
            "equipment.accessories",
          ])
          .session(session);

        if (!dungeon || !dungeon.active) {
          throw new Error("Active dungeon not found");
        }

        if (!character) {
          throw new Error("Character not found");
        }

        // 로그 처리
        const logIndex = dungeon.logs.findIndex(
          (log: DungeonLog) => log._id.toString() === logId
        );
        if (logIndex === -1) {
          throw new Error("Log not found");
        }

        const currentLog: DungeonLog = dungeon.logs[logIndex];
        if (!currentLog || !currentLog.data?.trap) {
          throw new Error("No active trap found");
        }

        const { success, roll, damage } = result;

        // 함정 결과 처리
        currentLog.data.trap.resolved = true;
        currentLog.data.trap.resolution = {
          success,
          roll,
          damage,
          description: success
            ? currentLog.data.trap.outcomes.success.description
            : currentLog.data.trap.outcomes.failure.description,
        };

        dungeon.logs[logIndex] = currentLog;

        // 경험치 보상
        const trapXP = success
          ? Math.floor(currentLog.data.trap.dc * 10)
          : Math.floor(currentLog.data.trap.dc * 5);

        // 경험치 적용 및 레벨업 처리
        character.experience += trapXP;
        const experienceResult = await processCombatExperience(
          character,
          session
        );

        // 레벨업 했는지 확인
        const didLevelUp =
          experienceResult.levelUps && experienceResult.levelUps.length > 0;

        // 레벨업했다면 HP를 최대치로, 아니면 함정 데미지 적용
        const newHP = didLevelUp
          ? character.hp.max // 레벨업 시 최대 HP로 설정
          : Math.max(0, dungeon.playerHP - damage); // 레벨업이 아닐 경우 데미지만 적용

        console.log("trap-result processing:", {
          didLevelUp,
          maxHP: character.hp.max,
          damage,
          newHP,
          dungeonPlayerHP: dungeon.playerHP,
        });

        // Save character changes
        await character.save({ session });

        // 던전 업데이트
        const updatedDungeon = await Dungeon.findByIdAndUpdate(
          dungeonId,
          {
            $set: {
              playerHP: newHP,
              logs: dungeon.logs,
            },
          },
          {
            new: true,
            session,
          }
        );

        return {
          success: true,
          message: success ? "함정 회피 성공" : "함정 피해 발생",
          dungeon: {
            ...updatedDungeon.toObject(),
            character,
          },
          trapResult: {
            success,
            roll,
            damage,
            description: success
              ? currentLog.data.trap.outcomes.success.description
              : currentLog.data.trap.outcomes.failure.description,
          },
          experienceGained: trapXP,
          levelUp: experienceResult.levelUps
            ? {
                levelsGained: experienceResult.levelUps.length,
                details: experienceResult.levelUps,
                nextLevelXP: experienceResult.nextLevelXP,
              }
            : null,
        };
      }
    );

    return NextResponse.json(transactionResult);
  } catch (error) {
    console.error("Trap result error:", error);
    return NextResponse.json(
      {
        error: "Failed to process trap result",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    if (mongoSession) {
      await mongoSession.endSession();
    }
  }
}
