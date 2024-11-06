import { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "로그인",
  description: "게임 계정으로 로그인하세요.",
};

export default function SignInPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>
              이메일과 비밀번호를 입력하여 로그인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
