import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { User } from "@/app/models";
import dbConnect from "@/lib/dbConnect";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { image } = await req.json();

    // Base64 데이터를 버퍼로 변환
    const buffer = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    const uploadsDir = path.join(process.cwd(), "public", "uploads/users");

    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.log("Directory already exists or error creating directory:", err);
    }

    // 파일명 생성 (예: userId-timestamp.jpg)
    const fileName = `${session.user.id}-${Date.now()}.jpg`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    await dbConnect();

    const imageUrl = `/uploads/users/${fileName}`;
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { image: imageUrl },
      { new: true }
    );

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({ image: user.image });
  } catch (error) {
    console.error("Error updating profile image:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
