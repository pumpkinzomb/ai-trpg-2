import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Character } from "@/app/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";
import { generateImage } from "@/app/utils/aiDrawing";

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
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const characterData = await req.json();
    const userId = session.user.id;

    console.log("characterData", characterData);

    // 캐릭터 이미지 생성을 위한 프롬프트 구성
    const imagePrompt = `
    a ${characterData.race} ${characterData.class} named ${characterData.name},
    full body shot, 
    fantasy character portrait
  `.trim();

    const profileImage = await generateImage(imagePrompt);

    const character = await Character.create({
      ...characterData,
      profileImage,
      userId: new Types.ObjectId(userId),
    });

    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    console.error("POST Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
