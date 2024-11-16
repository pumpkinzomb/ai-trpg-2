import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { Dungeon, Character } from "@/app/models";
import { DungeonLog, Item, UsedItem } from "@/app/types";
import { processCombatExperience } from "@/app/utils/character";

interface CombatResult {
  victory: boolean;
  remainingHp: number;
  usedItems: UsedItem[];
}

export async function POST(req: NextRequest) {
  let mongoSession = null;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { dungeonId, characterId, result } = (await req.json()) as {
      dungeonId: string;
      characterId: string;
      result: CombatResult;
    };

    if (!dungeonId || !characterId || !result) {
      return NextResponse.json(
        { error: "dungeonId, characterId and result are required" },
        { status: 400 }
      );
    }

    mongoSession = await mongoose.startSession();
    const transactionResult = await mongoSession.withTransaction(
      async (session) => {
        // Find documents within transaction
        const [dungeon, character] = await Promise.all([
          Dungeon.findById(dungeonId).session(session),
          Character.findById(characterId)
            .populate<{ inventory: Item[] }>("inventory")
            .session(session),
        ]);

        if (!dungeon || !dungeon.active) {
          throw new Error("Active dungeon not found");
        }

        if (!character) {
          throw new Error("Character not found");
        }

        const currentLog: DungeonLog = dungeon.logs[dungeon.logs.length - 1];
        if (!currentLog || !currentLog.data?.enemies) {
          throw new Error("No active combat found");
        }

        const { victory, remainingHp, usedItems } = result;

        let baseXP = 0;
        let bonusXP = 0;
        let totalExperienceGain = 0;

        // Calculate experience gains
        if (victory) {
          currentLog.data.enemies = currentLog.data.enemies.map((enemy) => ({
            ...enemy,
            hp: 0,
          }));
          baseXP = currentLog.data.rewards?.xp || 0;
          bonusXP = currentLog.data.enemies.reduce((total, enemy) => {
            const levelDiff = Math.max(0, enemy.level - character.level);
            return total + levelDiff * 50;
          }, 0);
          totalExperienceGain = baseXP + bonusXP;
        } else {
          totalExperienceGain = Math.floor(
            (currentLog.data.rewards?.xp || 0) * 0.3
          );
          baseXP = totalExperienceGain;
          bonusXP = 0;
        }

        // Update combat resolution
        if (!currentLog.data.combat) {
          currentLog.data.combat = {};
        }

        currentLog.data.combat.resolved = true;
        currentLog.data.combat.resolution = {
          victory,
          usedItems,
          experienceGained: victory ? totalExperienceGain : 0,
          remainingHp: victory ? remainingHp : 0,
        };

        // Process used items
        if (usedItems?.length > 0) {
          const itemUsageCount = new Map<string, number>();

          usedItems.forEach((usedItem) => {
            const count = itemUsageCount.get(usedItem.itemId) || 0;
            itemUsageCount.set(usedItem.itemId, count + 1);
          });

          const updatedInventory = character.inventory.reduce(
            (acc: Item[], item: Item) => {
              const usedCount = itemUsageCount.get(item._id.toString()) || 0;
              if (usedCount === 0) {
                acc.push(item);
              }
              return acc;
            },
            []
          );

          character.inventory = updatedInventory;
        }

        // Update character experience
        character.experience += totalExperienceGain;
        const experienceResult = await processCombatExperience(
          character,
          session
        );

        // Handle HP updates
        const didLevelUp =
          experienceResult.levelUps && experienceResult.levelUps.length > 0;

        let newHP;
        if (victory) {
          if (didLevelUp) {
            newHP = character.hp.max;
          } else {
            newHP = remainingHp;
          }
        } else {
          newHP = 0;
        }

        dungeon.playerHP = newHP;

        // Save changes within transaction
        const [savedCharacter, updatedDungeon] = await Promise.all([
          Character.findById(character._id)
            .select("-spells -arenaStats -proficiencies")
            .populate([
              "inventory",
              "equipment.weapon",
              "equipment.armor",
              "equipment.shield",
              "equipment.accessories",
            ])
            .session(session),
          Dungeon.findByIdAndUpdate(
            dungeonId,
            {
              $set: {
                playerHP: dungeon.playerHP,
                logs: dungeon.logs,
              },
            },
            {
              new: true,
              session,
            }
          ).populate("temporaryInventory.itemId"),
        ]);

        return {
          success: true,
          message: victory ? "Combat victory" : "Combat defeat",
          dungeon: {
            ...updatedDungeon.toObject(),
            character: savedCharacter,
          },
          experienceGained: totalExperienceGain,
          experienceBreakdown: {
            baseXP,
            bonusXP,
            total: totalExperienceGain,
          },
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
    console.error("Combat result error:", error);
    return NextResponse.json(
      {
        error: "Failed to process combat result",
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
