import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { Character, Dungeon } from "@/app/models";
import { GenerationDungeonLog } from "@/app/types";
import { generateImage } from "@/app/utils/aiDrawing";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateDungeon(playerLevel: number): Promise<{
  dungeonName: string;
  concept: string;
  maxStages: number;
  difficulty: "easy" | "normal" | "hard";
  firstLog: GenerationDungeonLog;
}> {
  const prompt = `
    D&D 5e 규칙 기반의 던전을 생성해주세요. JSON 형식으로 다음 구조를 따라주세요:
  
    {
      "dungeonName": string,      // 한국어로 된 독특하고 분위기 있는 던전 이름
      "concept": string,          // 한국어로 된 던전의 설정과 분위기 설명 (2-3문장)
      "maxStages": number,        // 층 수 (3-7)
      "difficulty": "easy" | "normal" | "hard",
      "firstScene": {
        "description": string,    // 한국어로 된 입구 장면 상세 설명
        "imagePrompt": string     // 영어로 된 이미지 생성용 프롬프트
      }
    }
  
    Requirements:
    - D&D 5e 레벨 ${playerLevel} 캐릭터에 적합한 난이도로 설정
    - 던전 난이도와 구조:
      * easy (CR ${playerLevel - 1} ~ ${playerLevel}): 3-4층
      * normal (CR ${playerLevel} ~ ${playerLevel + 1}): 4-5층
      * hard (CR ${playerLevel + 1} ~ ${playerLevel + 2}): 5-7층
    
    환경 묘사시 고려사항:
    - D&D의 전형적인 환경 유형 사용 
    - 잠재적 위험과 보물에 대한 암시
    - 주요 몬스터나 적대 세력의 흔적
    - 마법적 또는 기계적 장치의 존재 가능성
    
    imagePrompt는 다음 형식으로:
    "fantasy D&D dungeon entrance, [environment type], [key features], [atmosphere], [time of day], detailed, dramatic lighting"
    
    Return ONLY the JSON object with no additional text.
    `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  if (!response.choices[0].message.content) {
    throw new Error("Failed to generate dungeon");
  }

  const dungeon = JSON.parse(response.choices[0].message.content);

  // 필수 필드 검증
  if (
    !dungeon.dungeonName ||
    !dungeon.concept ||
    !dungeon.difficulty ||
    !dungeon.firstScene
  ) {
    throw new Error("Invalid dungeon generated: Missing required fields");
  }

  // 난이도 검증
  if (!["easy", "normal", "hard"].includes(dungeon.difficulty)) {
    throw new Error("Invalid difficulty level generated");
  }

  // maxStages 검증
  const maxStages = Math.min(Math.max(dungeon.maxStages || 3, 3), 7);
  if (
    (dungeon.difficulty === "easy" && (maxStages < 3 || maxStages > 4)) ||
    (dungeon.difficulty === "normal" && (maxStages < 4 || maxStages > 5)) ||
    (dungeon.difficulty === "hard" && (maxStages < 5 || maxStages > 7))
  ) {
    throw new Error(
      "Generated maxStages doesn't match difficulty requirements"
    );
  }

  // 이미지 생성
  const image = await generateImage(dungeon.firstScene.imagePrompt);

  // 첫 번째 로그 생성 (단순화된 버전)
  const firstLog: GenerationDungeonLog = {
    type: "story",
    description: dungeon.firstScene.description,
    image: image || undefined,
    timestamp: new Date(),
  };

  return {
    dungeonName: dungeon.dungeonName,
    concept: dungeon.concept,
    maxStages,
    difficulty: dungeon.difficulty,
    firstLog,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { characterId } = body;

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 }
      );
    }

    // 캐릭터 조회
    const character = await Character.findById(characterId).select(
      "name level class race hp profileImage inventory experience gold"
    );
    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    // 활성 던전 체크
    const existingDungeon = await Dungeon.findOne({
      characterId,
      active: true,
    });

    if (existingDungeon) {
      return NextResponse.json(
        { error: "Character already has an active dungeon" },
        { status: 400 }
      );
    }

    // 던전 생성
    const dungeonData = await generateDungeon(character.level);

    const dungeon = await Dungeon.create({
      characterId: character._id,
      dungeonName: dungeonData.dungeonName,
      concept: dungeonData.concept,
      currentStage: 0,
      maxStages: dungeonData.maxStages,
      canEscape: dungeonData.difficulty !== "hard",
      playerHP: character.hp.max,
      active: true,
      temporaryInventory: [],
      logs: [dungeonData.firstLog],
    });

    return NextResponse.json({
      success: true,
      dungeon: {
        ...dungeon.toObject(),
        character,
      },
    });
  } catch (error) {
    console.error("Dungeon initialization error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to initialize dungeon";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
