import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import TownClient from "./components/town-client";
import { generateImage } from "@/app/utils/aiDrawing";
import { MarketType } from "@/app/types";

// 마켓 타입별 등장 확률
const MARKET_SPAWN_RATES = {
  normal: 0.6, // 60%
  black: 0.25, // 25%
  secret: 0.15, // 15%
} as const;

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

export default async function TownPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // 시장 타입 결정
  const marketType = determineMarketType();

  // 시장 이미지 생성을 위한 프롬프트
  const marketPrompts = {
    secret:
      "A mysterious and magical fantasy marketplace hidden in alcoves, with rare magical items floating in the air, golden light streaming through stained glass windows, mystical merchants in elaborate robes",
    normal:
      "A bustling medieval fantasy marketplace in a town square, with wooden stalls, colorful awnings, friendly merchants displaying their wares",
    black:
      "A shadowy fantasy black market in narrow alleyways, with hooded figures, mysterious artifacts, dim lanterns casting eerie shadows",
  };

  const marketImage = await generateImage(marketPrompts[marketType]);

  return (
    <TownClient initialMarketType={marketType} marketImage={marketImage} />
  );
}
