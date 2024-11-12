import { NextRequest, NextResponse } from "next/server";
import { generateDungeonCombatPrompt } from "@/app/utils/aiDrawing";

export async function POST(request: NextRequest) {
  try {
    const sceneInfo = await request.json();

    const prompt = await generateDungeonCombatPrompt(sceneInfo);

    if (!prompt) {
      return NextResponse.json(
        { error: "Failed to generate prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error("Error in generate-combat-prompt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
