import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { Character, Dungeon, Item } from "@/app/models";
import { GenerationDungeonLog, GenerationItem } from "@/app/types";
import { generateImage } from "@/app/utils/aiDrawing";
import { Types } from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 난이도 설정을 위한 유틸리티 함수들
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

    const dungeon = await Dungeon.findById(dungeonId).populate("characterId");
    if (!dungeon || !dungeon.active) {
      return NextResponse.json(
        { error: "Active dungeon not found" },
        { status: 404 }
      );
    }

    const character = await Character.findById(dungeon.characterId);
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
  - BUT 'imagePrompt' must be in English for AI image generation
  
  Current dungeon: ${dungeon.dungeonName}
  Current stage: ${dungeon.currentStage + 1}/${dungeon.maxStages}
  Concept: ${dungeon.concept}
  Character level: ${character.level}
  Player HP: ${dungeon.playerHP}/${character.hp.max}
  Latest scene: ${
    dungeon.logs[dungeon.logs.length - 1]?.description || "던전에 진입합니다"
  }
  
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
    "combat": {
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
      }]
    },
    "rewards": {
      "gold": number,
      "goldLooted": boolean,
      "xp": number,
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
  
  Return ONLY the JSON object with no additional text.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("Failed to generate scene");
    }

    const result = JSON.parse(completion.choices[0].message.content);

    // 난이도 기반으로 결과 조정
    if (result.combat?.enemies) {
      result.combat.enemies = result.combat.enemies.map((enemy: any) => {
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
    if (result.rewards) {
      result.rewards.gold = Math.floor(
        result.rewards.gold * difficulty.rewards.goldMultiplier
      );
      result.rewards.xp = Math.floor(
        result.rewards.xp * difficulty.rewards.xpMultiplier
      );
    }

    const image = await generateImage(result.imagePrompt);

    let rewardItems: Types.ObjectId[] = [];
    if (result.rewards?.items?.length > 0) {
      const items = await Promise.all(
        result.rewards.items.map(async (itemData: GenerationItem) => {
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
      result.rewards.items = items;
    }

    const newLog: GenerationDungeonLog = {
      type: result.type,
      description: result.description,
      image: image || undefined,
      data: {
        enemies: result.combat?.enemies,
        rewards: result.rewards
          ? {
              gold: result.rewards.gold,
              xp: result.rewards.xp,
              items: result.rewards.items,
              goldLooted: false,
            }
          : undefined,
      },
      timestamp: new Date(),
    };

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

    return NextResponse.json(updatedDungeon);
  } catch (error) {
    console.error("Dungeon action error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon action" },
      { status: 500 }
    );
  }
}
