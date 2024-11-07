import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { User } from "@/app/models";
import dbConnect from "@/lib/dbConnect";
import { unlink } from "fs/promises";
import path from "path";

export async function PATCH(req: Request) {
  try {
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 요청 데이터 파싱
    const { name } = await req.json();

    // 데이터베이스 연결
    await dbConnect();

    // 사용자 업데이트
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { name },
      { new: true }
    );

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 응답
    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 현재 프로필 정보 조회
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// 프로필 삭제
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await dbConnect();

    // 사용자 찾기
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 사용자의 프로필 이미지 삭제
    if (user.image && user.image.startsWith("/uploads/")) {
      try {
        const imagePath = path.join(process.cwd(), "public", user.image);
        await unlink(imagePath);
      } catch (error) {
        console.error("Error deleting profile image file:", error);
        // 이미지 삭제 실패는 전체 프로세스를 중단하지 않습니다
      }
    }

    // 마지막으로 사용자 삭제
    await User.findByIdAndDelete(user._id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting profile:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
