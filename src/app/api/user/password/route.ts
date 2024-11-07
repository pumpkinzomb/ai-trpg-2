import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { User } from "@/app/models";
import dbConnect from "@/lib/dbConnect";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return new NextResponse("Invalid current password", { status: 400 });
    }

    // 새 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // 비밀번호 업데이트
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
