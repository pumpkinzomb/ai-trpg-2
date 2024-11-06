import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { User } from "@/app/models";
import dbConnect from "@/lib/dbConnect";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { name, email, password } = await req.json();

    // 기본 유효성 검사
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "모든 필드를 입력해주세요." },
        { status: 400 }
      );
    }

    console.log("check", name, email, password);

    // 이메일 중복 체크
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await hash(password, 12);

    // 새 사용자 생성
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    // 비밀번호 제외하고 응답
    const { password: _, ...userWithoutPassword } = user.toObject();

    return NextResponse.json(
      { message: "회원가입이 완료되었습니다.", user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error("회원가입 에러:", error);
    return NextResponse.json(
      { message: "서버 에러가 발생했습니다." },
      { status: 500 }
    );
  }
}
