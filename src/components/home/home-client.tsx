"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Gamepad2,
  Sword,
  Shield,
  Crown,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function HomeClient() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center bg-gradient-to-b from-purple-500/10 via-blue-500/5 to-background text-center space-y-8">
        <div className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20">
          <div className="blur-[106px] h-56 bg-gradient-to-br from-primary to-purple-400 dark:from-blue-700"></div>
          <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300 dark:to-indigo-600"></div>
        </div>
        <Sparkles className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight relative z-10">
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
            AI TRPG
          </span>
        </h1>
        <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground relative z-10">
          AI와 함께하는 새로운 차원의 롤플레잉 게임. 당신만의 캐릭터로 모험을
          시작하세요.
        </p>
        <div className="flex gap-4 relative z-10">
          {!session ? (
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              onClick={() => router.push("/auth/signin")}
            >
              시작하기 <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              onClick={() => router.push("/dashboard")}
            >
              게임 시작 <Gamepad2 className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">주요 기능</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              다양한 기능으로 더욱 풍부한 게임 경험을 제공합니다
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sword className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>전투 시스템</CardTitle>
                <CardDescription>
                  실시간으로 진행되는 전략적 전투
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  턴제 기반의 전투 시스템으로 각 캐릭터의 특성을 살려 전략적인
                  플레이를 즐기세요.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>캐릭터 성장</CardTitle>
                <CardDescription>자유로운 캐릭터 육성 시스템</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  다양한 클래스와 스킬을 조합하여 나만의 특별한 캐릭터를
                  만들어보세요.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>랭킹 시스템</CardTitle>
                <CardDescription>경쟁을 통한 성장</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  아레나에서 다른 플레이어들과 겨루며 최고의 자리에 도전하세요.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
