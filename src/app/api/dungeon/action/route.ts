import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { Character, Dungeon, Item, ICharacter } from "@/app/models";
import { DungeonLog, GenerationDungeonLog, GenerationItem } from "@/app/types";
import { generateImage } from "@/app/utils/aiDrawing";
import { Types } from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const getDefaultXP = (character: ICharacter, difficulty: any, type: string) => {
  const baseXP = Math.floor(character.level * 90);
  const multiplier =
    type === "combat"
      ? 1
      : type === "trap"
      ? 0.7
      : type === "treasure"
      ? 0.3
      : 0.2;

  return Math.floor(baseXP * multiplier * difficulty.rewards.xpMultiplier);
};

const getDifficultyLevel = (
  characterLevel: number,
  currentStage: number,
  maxStages: number
) => {
  // 스테이지가 진행될수록 난이도 상승
  const stageProgression = currentStage / maxStages;

  // 레벨 1 캐릭터를 위한 특별 조정
  const isLowLevel = characterLevel <= 2;
  const levelMultiplier = isLowLevel ? 0.7 : 1;

  return {
    combatDifficulty: {
      enemyLevel: Math.max(
        1,
        characterLevel + Math.floor(stageProgression * 1.5)
      ),
      enemyCount: Math.max(
        1,
        Math.floor(1 + stageProgression * (isLowLevel ? 1 : 2))
      ),
      bossMultiplier:
        currentStage === maxStages - 1 ? (isLowLevel ? 1.3 : 1.5) : 1,
    },
    trapDifficulty: {
      dcBase:
        8 + Math.floor(characterLevel / 2) + Math.floor(stageProgression * 4),
      damageDice: `${Math.max(
        1,
        Math.floor(1 + stageProgression * (isLowLevel ? 1 : 2))
      )}d4`,
    },
    rewards: {
      goldMultiplier: (1 + stageProgression) * levelMultiplier,
      xpMultiplier: (1 + stageProgression) * levelMultiplier,
      itemRarityChance: {
        common: Math.max(0.5 - stageProgression * 0.8, 0.2),
        uncommon: 0.3,
        rare: 0.15 + stageProgression * 0.1,
        epic: 0.03 + stageProgression * 0.1,
        legendary: Math.max(0, (stageProgression - 0.8) * 0.1),
      },
    },
  };
};

const generateEnemyStats = (level: number, isBoss: boolean = false) => {
  const isLowLevel = level <= 2;
  const multiplier = isBoss ? (isLowLevel ? 1.3 : 1.5) : 1;

  return {
    hp: Math.floor((level * 6 + 8) * multiplier * (isLowLevel ? 0.8 : 1)),
    ac: Math.floor((11 + level / 3) * multiplier),
    attacks: [
      {
        toHit: Math.floor((level / 3 + 3) * multiplier),
        damage: `${1}d${isLowLevel ? 4 : 6}+${Math.floor(level / 3)}`,
      },
    ],
  };
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, dungeonId } = body;

    if (!action || !dungeonId) {
      return NextResponse.json(
        { error: "Action and dungeonId are required" },
        { status: 400 }
      );
    }

    const dungeon = await Dungeon.findById(dungeonId);
    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    const character = await Character.findById(dungeon.characterId).select(
      "name level class race hp profileImage inventory experience gold"
    );

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    if (dungeon.playerHP <= 0) {
      return NextResponse.json(
        { error: "Character is defeated" },
        { status: 400 }
      );
    }

    // 난이도 설정 계산
    const difficulty = getDifficultyLevel(
      character.level,
      dungeon.currentStage,
      dungeon.maxStages
    );

    // 개선된 프롬프트
    const prompt = `
  Based on the following D&D 5e dungeon context and player action, generate the next scene.
  IMPORTANT: 
  - All descriptions, names, and text should be in Korean language
  - BUT 'imagePrompt' must be in English for image generation
  
  Current dungeon: ${dungeon.dungeonName}
  Current Concept: ${dungeon.concept}
  Current stage: ${dungeon.currentStage + 1}/${dungeon.maxStages}
  Previous encounters: ${dungeon.logs
    .slice(-3)
    .map((log: DungeonLog) => log.type)
    .join(", ")}
  
  PACING GUIDELINES:
  - Stage should progress after 2-3 significant encounters
  - Avoid consecutive encounters of the same type
  - If last 3 encounters were combat, force a different type
  - Current stage must progress if: combat victory AND no combat in next stage OR successful trap/puzzle completion
  
  ENCOUNTER VARIETY:
  - Combat (35%): Varied enemies with different abilities
  - Traps/Puzzles (25%): Require different skill checks
  - Treasure Rooms (20%): After significant challenges
  - Story/Exploration (15%): Advance plot and provide lore
  - Rest (5%): When player HP below 70%
  
  REWARD DISTRIBUTION:
  Combat Victory: 
  - Gold: ${Math.floor(character.level * 10)} - ${Math.floor(
      character.level * 20
    )}
  - Items: 40% chance
  - XP: ${Math.floor(character.level * 15)}
  
  Trap Success:
  - Gold: ${Math.floor(character.level * 5)} - ${Math.floor(
      character.level * 15
    )}
  - Items: 30% chance
  - XP: ${Math.floor(character.level * 10)}
  
  Treasure Room:
  - Gold: ${Math.floor(character.level * 20)} - ${Math.floor(
      character.level * 40
    )}
  - Items: 100% chance
  - XP: ${Math.floor(character.level * 5)}
  
  Difficulty settings:
  - Enemy levels should be around level ${
    difficulty.combatDifficulty.enemyLevel
  }
  - Encounter size: ${difficulty.combatDifficulty.enemyCount} enemies
  - Trap DC base: ${difficulty.trapDifficulty.dcBase}
  - Trap damage: ${difficulty.trapDifficulty.damageDice}
  ${
    dungeon.currentStage === dungeon.maxStages - 1
      ? "- This is a boss stage (1.5x difficulty multiplier)"
      : ""
  }
  
  REWARD GUIDELINES:
  For combat encounters:
  - Regular enemies may drop ${Math.floor(character.level * 10)} - ${Math.floor(
      character.level * 20
    )} gold
  - Elite or boss enemies have higher chances for valuable items
  - XP rewards scale with enemy difficulty

  For treasure rooms:
  - Should contain multiple items and significant gold
  - Higher quality items than regular encounters

  For traps and challenges:
  - Successful navigation may reveal hidden treasures
  - Complex traps can guard valuable rewards

  Item rarity chances:
  - Common: ${(difficulty.rewards.itemRarityChance.common * 100).toFixed(1)}%
  - Uncommon: ${(difficulty.rewards.itemRarityChance.uncommon * 100).toFixed(
    1
  )}%
  - Rare: ${(difficulty.rewards.itemRarityChance.rare * 100).toFixed(1)}%
  - Epic: ${(difficulty.rewards.itemRarityChance.epic * 100).toFixed(1)}%
  - Legendary: ${(difficulty.rewards.itemRarityChance.legendary * 100).toFixed(
    1
  )}%
  
  Scene type distribution (not strict):
  - Combat: 40%
  - Trap: 25%
  - Treasure: 20%
  - Story: 10%
  - Rest: 5%
  
  Player action: "${action}"

  Consider the following elements for scene generation:
  - All descriptions and texts must be in Korean EXCEPT for imagePrompt
  - Use appropriate Korean fantasy terminology
  - Maintain consistent difficulty based on provided settings
  - Balance rewards according to stage progression
  - ${
    dungeon.currentStage === dungeon.maxStages - 1
      ? "대단원의 보스전을 연출하세요"
      : "다양한 형태의 전투를 구성하세요"
  }
  - Ensure combat challenges are appropriate for character level
  - Include environmental elements and tactical options
  
  Style guide for Korean text:
  - Use descriptive and atmospheric language for scene descriptions
  - Use traditional fantasy-style naming for monsters and items
  - Include Korean-style onomatopoeia when appropriate
  - Keep the tone consistent with classic fantasy RPG
  
  IMPORTANT FOR IMAGE PROMPT:
  - The 'imagePrompt' field must be in English
  - Keep it descriptive and specific
  - Include art style references if relevant
  - Describe the scene, lighting, and atmosphere in English
  - Example: "A dark stone dungeon corridor with glowing mushrooms, mysterious fog rolling across the floor, dramatic lighting, fantasy art style"
  
  Response format (JSON):
  {
    "description": "한글로 된 상황 설명",
    "type": "combat" | "trap" | "treasure" | "story" | "rest",
    "imagePrompt": "Scene description in English for image generation",
    "effects": {
      "hpChange": number,
      "stageProgress": boolean
    },
    "data": {
      "enemies": [{
        "name": "한글 몬스터 이름",
        "level": number,
        "hp": number,
        "ac": number,
        "attacks": [{
          "name": "한글 공격 이름",
          "damage": string,
          "toHit": number
        }]
      }],
      "trap": {                           // Only for trap type
        "type": "dexterity" | "strength" | "constitution" | "intelligence" | "wisdom",
        "dc": number,
        "outcomes": {
          "success": {
            "description": "성공시 상황 설명",
          },
          "failure": {
            "description": "실패시 상황 설명",
          }
        }
      },
      "rewards": {
        "gold": number,
        "goldLooted": boolean,
        "items": [{
          "name": "한글 아이템 이름",
          "type": "weapon" | "light-armor" | "medium-armor" | "heavy-armor" | "shield" | "accessory" | "consumable",
          "rarity": "common" | "uncommon" | "rare" | "epic" | "legendary",
          "stats": {
            "damage": string,
            "defense": number,
            "effects": [{
              "type": string,
              "value": string
            }]
          },
          "requiredLevel": number,
          "value": number,
          "description": "한글 아이템 설명"
        }]
      }
    }
  }
  
  For trap scenes, ensure:
  1. The trap type matches the environmental context
  2. DC is calculated as: base DC (${
    difficulty.trapDifficulty.dcBase
  }) + situational modifier (-2 to +2)
  3. Damage on failure should use the specified damage dice: ${
    difficulty.trapDifficulty.damageDice
  }
  4. Success should either avoid all damage or take reduced damage
  5. Descriptions should be vivid and reflect the tension of the moment
  
  Return ONLY the JSON object with no additional text.

  Recent History:
  ${JSON.stringify(dungeon.logs, null, 2)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a dungeon master creating varied and engaging encounters. Balance combat with exploration and ensure appropriate stage progression. Each stage should take 2-3 encounters, with varied rewards based on challenge type and significance. Consider previous encounters when generating new ones.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("Failed to generate scene");
    }

    const result = JSON.parse(completion.choices[0].message.content);

    // trap 타입일 때만 trap 데이터 검증 및 보정
    if (result.type === "trap" && !result.data?.trap) {
      const trapDC = difficulty.trapDifficulty.dcBase;
      // 기본 데미지 계산 (예: 1d4 + 레벨/2)
      const trapDamage =
        Math.floor(Math.random() * 4) + 1 + Math.floor(character.level / 2);

      result.data = {
        ...result.data,
        trap: {
          type: "dexterity", // 기본값으로 민첩 판정
          dc: trapDC,
          outcomes: {
            success: {
              description: "함정을 성공적으로 피했습니다.",
            },
            failure: {
              description:
                result.description || "함정에 걸려 피해를 입었습니다.",
            },
          },
        },
      };

      if (!result.effects) {
        result.effects = {
          hpChange: -trapDamage,
          stageProgress: false,
        };
      } else if (result.effects.hpChange === undefined) {
        // effects는 있지만 hpChange가 없는 경우
        result.effects.hpChange = -trapDamage;
      }
    }

    console.log("check result", result);

    // 난이도 기반으로 결과 조정
    if (result.data?.enemies) {
      result.data.enemies = result.data.enemies.map((enemy: any) => {
        const baseStats = generateEnemyStats(
          difficulty.combatDifficulty.enemyLevel,
          dungeon.currentStage === dungeon.maxStages - 1
        );
        return {
          ...enemy,
          ...baseStats,
        };
      });
    }

    // 보상 조정
    if (result.data?.rewards) {
      result.data.rewards.gold = Math.floor(
        result.data.rewards.gold * difficulty.rewards.goldMultiplier
      );
      result.data.rewards.xp = Math.floor(
        result.data.rewards.xp * difficulty.rewards.xpMultiplier
      );
    }

    const image = await generateImage(result.imagePrompt);

    let rewardItems: Types.ObjectId[] = [];
    if (result.data?.rewards?.items?.length > 0) {
      const items = await Promise.all(
        result.data.rewards.items.map(async (itemData: GenerationItem) => {
          const item = await Item.create({
            ...itemData,
            previousOwnerId: null,
            ownerId: null,
            isBaseItem: false,
          });
          rewardItems.push(item._id);
          return item;
        })
      );
      result.data.rewards.items = items;
    }

    const newLog: GenerationDungeonLog = {
      type: result.type,
      description: result.description,
      image: image || undefined,
      effects: result.effects || {
        hpChange: -Math.floor(character.level * 1.5), // 캐릭터 레벨 기반 기본 데미지
        stageProgress: false,
      },
      data: {
        ...(result.type === "trap" ? { trap: result.data.trap } : {}),
        enemies: result.data?.enemies,
        rewards: result.data?.rewards
          ? {
              gold: Math.floor(Number(result.data.rewards.gold) || 0), // 숫자로 변환하고 floor 처리
              xp:
                Math.floor(Number(result.data.rewards.xp)) ||
                getDefaultXP(character, difficulty, result.type),
              items: Array.isArray(result.data.rewards.items)
                ? result.data.rewards.items
                : [],
              goldLooted: false,
            }
          : undefined,
      },
      timestamp: new Date(),
    };

    console.log("check newLog", newLog);

    const newHP = Math.max(
      0,
      dungeon.playerHP + (result.effects.hpChange || 0)
    );
    let newStage = dungeon.currentStage;

    if (
      result.effects.stageProgress &&
      dungeon.currentStage < dungeon.maxStages - 1
    ) {
      newStage += 1;
    }

    const updatedDungeon = await Dungeon.findByIdAndUpdate(
      dungeonId,
      {
        $set: {
          playerHP: newHP,
          currentStage: newStage,
        },
        $push: { logs: newLog },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("characterId");

    return NextResponse.json({
      ...updatedDungeon.toObject(),
      character,
    });
  } catch (error) {
    console.error("Dungeon action error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon action" },
      { status: 500 }
    );
  }
}
