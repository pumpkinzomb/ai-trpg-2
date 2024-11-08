import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { generateImage } from "@/app/utils/aiDrawing";
import { TempleClient } from "./components/temple-client";

export default async function TemplePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // 신전 이미지 생성을 위한 프롬프트
  const templeImagePrompt = `
    A wise and serene priest in ornate robes standing in a grand fantasy temple,
    stained glass windows in background, 
    holy symbols and magical healing auras,
    warm and divine lighting,
    peaceful atmosphere
  `.trim();

  const templeImage = await generateImage(templeImagePrompt);

  return <TempleClient templeImage={templeImage} />;
}
