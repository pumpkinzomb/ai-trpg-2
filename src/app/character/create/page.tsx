import { Metadata } from "next";
import CharacterCreation from "./components/CharacterCreation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "캐릭터 생성 | AI TRPG",
  description: "새로운 캐릭터를 생성하고 당신만의 모험을 시작하세요.",
};

export default async function CharacterCreatePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container py-10">
      <CharacterCreation />
    </div>
  );
}
