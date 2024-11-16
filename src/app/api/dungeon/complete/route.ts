import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";
import mongoose from "mongoose";
import { calculateCompletionXP } from "@/app/utils/xpCalculator";
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
    const result = await mongoSession.withTransaction(async (session) => {
      // Find documents within transaction
      const [dungeon, character] = await Promise.all([
        Dungeon.findById(dungeonId).session(session),
        Character.findById(characterId).session(session),
      ]);

      if (!dungeon || !dungeon.active) {
        throw new Error("Active dungeon not found");
      }

      if (dungeon.currentStage !== dungeon.maxStages - 1) {
        throw new Error("Cannot complete dungeon before reaching final stage");
      }

      if (!character) {
        throw new Error("Character not found");
      }

      // Calculate completion rewards
      const completionXP = calculateCompletionXP(dungeon, character.level);
      const unclaimedGold = dungeon.logs.reduce((total: number, log: any) => {
        if (log.data?.rewards?.gold && !log.data.rewards.goldLooted) {
          return total + log.data.rewards.gold;
        }
        return total;
      }, 0);

      const bonusGold = Math.floor(
        unclaimedGold * 0.1 +
          dungeon.maxStages * 50 +
          (dungeon.recommendedLevel > character.level ? 200 : 100)
      );

      const totalGold = unclaimedGold + bonusGold;

      // Update character
      character.experience += completionXP;
      character.gold += totalGold;

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
          status: "completed",
          completedAt: new Date(),
          rewards: {
            xp: completionXP,
            gold: totalGold,
            bonusGold: bonusGold,
          },
          "logs.$[].data.rewards.goldLooted": true,
          playerHP: character.hp.current,
        },
        { session }
      );

      // Handle inventory
      await handleDungeonItems(dungeon, character, "complete", session);

      // Get final character state
      const savedCharacter = await Character.findById(character._id).session(
        session
      );

      return {
        success: true,
        message: "Successfully completed dungeon",
        rewards: {
          xp: completionXP,
          gold: totalGold,
          breakdown: {
            baseGold: unclaimedGold,
            bonusGold: bonusGold,
          },
          items: dungeon.temporaryInventory.length,
        },
        progress: {
          currentStage: dungeon.currentStage,
          maxStages: dungeon.maxStages,
          recommendedLevel: dungeon.recommendedLevel,
          playerLevel: savedCharacter.level,
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Dungeon completion error:", error);
    return NextResponse.json(
      {
        error: "Failed to process dungeon completion",
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
