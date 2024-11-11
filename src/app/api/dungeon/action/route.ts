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

// Action API Handler
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

    // 현재 던전과 캐릭터 상태 조회
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

    // 플레이어가 죽었는지 확인
    if (dungeon.playerHP <= 0) {
      return NextResponse.json(
        { error: "Character is defeated" },
        { status: 400 }
      );
    }

    // OpenAI를 사용하여 액션 결과 생성
    const prompt = `
      Based on the following D&D 5e dungeon context and player action, generate the next scene:
      
      Current dungeon: ${dungeon.dungeonName}
      Current stage: ${dungeon.currentStage + 1}/${dungeon.maxStages}
      Concept: ${dungeon.concept}
      Character level: ${character.level}
      Player HP: ${dungeon.playerHP}/${character.hp.max}
      Latest scene: ${dungeon.logs[dungeon.logs.length - 1].description}
      
      Player action: "${action}"
      
      Response format (JSON):
      {
        "description": string,
        "type": "combat" | "trap" | "treasure" | "story" | "rest",
        "imagePrompt": string,
        "effects": {
          "hpChange": number,
          "stageProgress": boolean    // true when the action leads to next stage
        },
        "combat": {                   // Optional combat data
          "enemies": [{
            "name": string,
            "level": number,
            "hp": number,
            "ac": number,
            "attacks": [{
              "name": string,
              "damage": string,
              "toHit": number
            }]
          }]
        },
        "rewards": {                  // Optional rewards
          "gold": number,
          "goldLooted": boolean,
          "xp": number,
          "items": [{
            "name": string,
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
            "description": string
          }]
        }
      }
      
      Consider:
      - Action consequences based on D&D rules
      - Character level and current dungeon stage
      - Balance rewards based on stage/difficulty
      - Combat difficulty appropriate for character level
      
      Important notes for stage progression:
      - Set stageProgress to true when the action completes current stage objectives
      - Consider room exploration, combat completion, puzzle solving as stage completion triggers
      - Current stage: ${dungeon.currentStage + 1}, Max stages: ${
      dungeon.maxStages
    }
      
      ${
        dungeon.currentStage === dungeon.maxStages - 1
          ? "This is the final stage. Focus on concluding events."
          : "Progress to next stage when appropriate."
      }
      
      Return ONLY the JSON object with no additional text.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!completion.choices[0].message.content) {
      throw new Error("Failed to generate scene");
    }

    const result = JSON.parse(completion.choices[0].message.content);

    // 이미지 생성
    const image = await generateImage(result.imagePrompt);

    // 아이템 생성 및 저장 (있는 경우)
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

    // 새 로그 생성
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

    // 던전 상태 업데이트 로직 수정
    const newHP = Math.max(
      0,
      dungeon.playerHP + (result.effects.hpChange || 0)
    );
    let newStage = dungeon.currentStage;

    // 스테이지 진행 조건 명확화
    if (
      result.effects.stageProgress &&
      dungeon.currentStage < dungeon.maxStages - 1
    ) {
      newStage += 1;
    }

    // updateOne 대신 findByIdAndUpdate 사용하여 업데이트 확인
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

    console.log("Stage Progress:", {
      wasStageProgress: result.effects.stageProgress,
      previousStage: dungeon.currentStage,
      newStage: updatedDungeon.currentStage,
      maxStages: dungeon.maxStages,
    });

    return NextResponse.json(updatedDungeon);
  } catch (error) {
    console.error("Dungeon action error:", error);
    return NextResponse.json(
      { error: "Failed to process dungeon action" },
      { status: 500 }
    );
  }
}
