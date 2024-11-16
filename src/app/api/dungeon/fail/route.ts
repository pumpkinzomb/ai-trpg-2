import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateFailureXP } from "@/app/utils/xpCalculator";
import { handleDungeonItems } from "@/app/utils/dungeonItems";
import { processCombatExperience } from "@/app/utils/character";

export async function POST(req: NextRequest) {
  let mongoSession = null;

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

    // Start transaction
    mongoSession = await mongoose.startSession();
    await mongoSession.withTransaction(async (session) => {
      // Find documents within transaction
      const dungeon = await Dungeon.findById(dungeonId).session(session);
      const character = await Character.findById(characterId).session(session);

      if (!dungeon || !dungeon.active) {
        throw new Error("Active dungeon not found");
      }

      if (!character) {
        throw new Error("Character not found");
      }

      // Calculate failure rewards
      const failureXP = calculateFailureXP(dungeon, character.level);
      const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
        if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
          return total + log.data.rewards.gold;
        }
        return total;
      }, 0);
      const preservedGold = Math.floor(unclaimedGold * 0.2);

      // Update character
      character.experience += failureXP;
      character.gold += preservedGold;
      character.hp.current = 0;
      await character.save({ session });

      // Process combat experience
      const experienceResult = await processCombatExperience(
        character,
        session
      );

      // Update dungeon
      await Dungeon.findByIdAndUpdate(
        dungeonId,
        {
          active: false,
          status: "failed",
          completedAt: new Date(),
          rewards: {
            xp: failureXP,
            gold: preservedGold,
          },
          "logs.$[].data.rewards.goldLooted": true,
          playerHP: 0,
        },
        { session }
      );

      // Handle inventory
      await handleDungeonItems(dungeon, character, "fail", session);

      return {
        success: true,
        message: "Dungeon failed",
        rewards: {
          xp: failureXP,
          preservedGold,
        },
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          progressPercentage: Math.floor(
            (dungeon.currentStage / dungeon.maxStages) * 100
          ),
        },
        lostItems: dungeon.temporaryInventory.length,
        status: {
          hp: 0,
          needsHealing: true,
        },
        levelUp: experienceResult.levelUps
          ? {
              levelsGained: experienceResult.levelUps.length,
              details: experienceResult.levelUps,
              nextLevelXP: experienceResult.nextLevelXP,
            }
          : null,
      };
    });

    return NextResponse.json(mongoSession.transaction);
  } catch (error) {
    console.error("Dungeon fail error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon failure",
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
