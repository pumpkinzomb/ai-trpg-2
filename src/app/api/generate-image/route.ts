import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/app/utils/aiDrawing";

export async function POST(req: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      return NextResponse.json(
        { error: "Hugging Face API key is not configured" },
        { status: 500 }
      );
    }

    // 요청 바디 파싱
    const body = await req.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // 이미지 생성 유틸리티 함수 호출
    const imageUrl = await generateImage(prompt);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error in image generation route:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate image: ${errorMessage}` },
      { status: 500 }
    );
  }
}
