import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TownClient from "./components/town-client";
import { generateImage, saveGeneratedImage } from "@/app/utils/aiDrawing";
import { MarketType } from "@/app/types";
import fs from "fs/promises";
import path from "path";

const MAX_MARKET_IMAGES = 5;

const MARKET_SPAWN_RATES = {
  normal: 0.6,
  black: 0.25,
  secret: 0.15,
} as const;

// 각 마켓 타입별 다양한 프롬프트
const MARKET_PROMPTS = {
  normal: [
    "A peaceful medieval fantasy marketplace in a friendly village, with local farmers selling fresh produce, craftsmen showing their work, warm sunlight and cheerful atmosphere",
    "A cozy village marketplace with wooden stalls and happy villagers, children playing around fountains, merchants displaying daily goods and fresh food",
    "A welcoming town square market with colorful awnings, locals trading goods, bakers selling fresh bread, and a peaceful community atmosphere",
    "A bright and lively village marketplace, with friendly merchants, handcrafted goods, fresh vegetables, and villagers chatting peacefully",
    "A harmonious village market scene with thatched roof stalls, local artisans, fresh produce displays, and peaceful townsfolk trading",
  ],

  secret: [
    "A mystical hidden marketplace with floating magical artifacts, mysterious robed figures trading rare items, ethereal lights and magical wisps in the air",
    "A secret magical bazaar concealed by illusions, with rare spell components, enchanted items glowing with power, and mysterious magical merchants",
    "An ethereal marketplace between dimensions, with arcane artifacts, mysterious traders in elaborate robes, and swirling magical energies",
    "A hidden mystical market with floating crystals, rare magical ingredients, mysterious hooded figures, and ancient magical artifacts",
    "A secret arcane marketplace with magical fountains, floating enchanted items, mysterious wizard merchants, and glowing magical runes",
  ],

  black: [
    "A dangerous black market in dark alleyways, with hooded figures trading illegal goods, ominous shadows, and flickering lanterns",
    "A shady underground marketplace with suspicious dealers, contraband items hidden in shadows, and dangerous-looking customers lurking",
    "A dangerous black market hidden in dark corners, with masked merchants, illegal goods in shadowy alcoves, and threatening atmosphere",
    "A dimly lit black market in narrow streets, with dangerous traders, forbidden items, and menacing figures in the shadows",
    "A treacherous black market scene with hooded dealers, illegal trades happening in shadows, and dangerous items displayed discreetly",
  ],
};

function determineMarketType(): MarketType {
  const rand = Math.random();
  let cumulative = 0;

  for (const [type, rate] of Object.entries(MARKET_SPAWN_RATES)) {
    cumulative += rate;
    if (rand <= cumulative) {
      return type as MarketType;
    }
  }

  return "normal";
}

async function getOrGenerateMarketImage(
  marketType: MarketType
): Promise<string> {
  const randomSlot = Math.floor(Math.random() * MAX_MARKET_IMAGES);
  const expectedPath = path.join(
    process.cwd(),
    "public",
    "uploads",
    "generated-image",
    "market",
    marketType,
    `image${randomSlot}.png`
  );

  try {
    await fs.access(expectedPath);
    console.log(
      `Using existing ${marketType} market image at slot ${randomSlot}`
    );
    return `/uploads/generated-image/market/${marketType}/image${randomSlot}.png`;
  } catch {
    console.log(
      `Generating new ${marketType} market image for slot ${randomSlot}`
    );

    // 해당 마켓 타입의 프롬프트 중 랜덤 선택
    const prompts = MARKET_PROMPTS[marketType];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    const generatedImagePath = await generateImage(randomPrompt);
    if (!generatedImagePath) {
      throw new Error(
        `Failed to generate ${marketType} market image for slot ${randomSlot}`
      );
    }

    return await saveGeneratedImage(
      generatedImagePath,
      `market/${marketType}`, // 하위 경로에 marketType 포함
      `image${randomSlot}`
    );
  }
}

export default async function TownPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const marketType = determineMarketType();
  const marketImage = await getOrGenerateMarketImage(marketType);

  return (
    <TownClient initialMarketType={marketType} marketImage={marketImage} />
  );
}
