import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Character } from "@/app/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { generateImage, saveGeneratedImage } from "@/app/utils/aiDrawing";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = session.user.id;

    const characters = await Character.find({
      userId: new Types.ObjectId(userId),
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("equipment.weapon equipment.armor equipment.shield inventory")
      .lean();

    const total = await Character.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    return NextResponse.json({
      characters,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET Characters error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const authSession = await getServerSession(authOptions);

    if (!authSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const characterData = await req.json();
    const userId = authSession.user.id;

    // 이미지 생성 (가장 오래 걸리고 실패 가능성이 높은 작업)
    const imagePrompt = `
      a ${characterData.race} ${characterData.class} named ${characterData.name},
      full body shot,
      fantasy character portrait
    `.trim();

    const generatedImagePath = await generateImage(imagePrompt);
    if (!generatedImagePath) {
      throw new Error("Failed to generate character profile image");
    }

    // 캐릭터 생성
    const character = await Character.create({
      ...characterData,
      userId: new Types.ObjectId(userId),
    });

    // 생성된 이미지 저장 및 이동
    const savedImagePath = await saveGeneratedImage(
      generatedImagePath,
      `users/${userId}/characters/${character._id.toString()}`,
      "profile"
    );

    // 캐릭터 문서에 이미지 경로 업데이트
    const updatedCharacter = await Character.findByIdAndUpdate(
      character._id,
      { profileImage: savedImagePath },
      { new: true }
    );

    return NextResponse.json(updatedCharacter, { status: 201 });
  } catch (error) {
    console.error("POST Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
