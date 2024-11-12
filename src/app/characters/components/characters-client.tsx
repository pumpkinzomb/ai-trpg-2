"use client";

import { useState } from "react";
import useSWR from "swr";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Shield, Swords, Crown, Plus, ArrowRight } from "lucide-react";
import { CharacterStatusSection } from "./CharacterStatusSection";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Character } from "@/app/types";
import { CardContent, Card } from "@/components/ui/card";
import { DeleteCharacterDialog } from "./DeleteCharacterDialog";

interface PaginationData {
  total: number;
  page: number;
  pages: number;
}

interface CharactersResponse {
  characters: Character[];
  pagination: PaginationData;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch characters");
  return res.json();
};

const calculateAC = (character: Character) => {
  const dexModifier = Math.floor((character.stats.dexterity - 10) / 2);

  // 갑옷이 없는 경우 기본 AC (10 + Dex)
  if (!character.equipment.armor) {
    return 10 + dexModifier;
  }

  // 갑옷 타입에 따른 AC 계산
  let baseAC = character.equipment.armor.stats.defense!;

  // 갑옷 타입별 방어도 계산
  switch (character.equipment.armor.type) {
    case "light-armor":
      baseAC += dexModifier;
      break;
    case "medium-armor":
      baseAC += Math.min(dexModifier, 2);
      break;
    case "heavy-armor":
      // Dex 보너스 없음
      break;
    default:
      baseAC += dexModifier; // 기본값은 light armor처럼 처리
  }

  // 방패 보너스 추가
  if (character.equipment.shield) {
    baseAC += character.equipment.shield.stats.defense!;
  }

  return baseAC;
};

const resourceColors: Record<
  string,
  {
    bg: string;
    darkBg: string;
    indicator: string;
    text: string;
    darkText: string;
  }
> = {
  // 마법계열
  Mana: {
    bg: "bg-blue-200",
    darkBg: "dark:bg-blue-950",
    indicator: "bg-gradient-to-r from-blue-500 to-blue-600",
    text: "text-blue-600",
    darkText: "dark:text-blue-400",
  },
  // 특수계열
  Rage: {
    bg: "bg-orange-200",
    darkBg: "dark:bg-orange-950",
    indicator: "bg-gradient-to-r from-orange-500 to-orange-600",
    text: "text-orange-600",
    darkText: "dark:text-orange-400",
  },
  Ki: {
    bg: "bg-yellow-200",
    darkBg: "dark:bg-yellow-950",
    indicator: "bg-gradient-to-r from-yellow-500 to-yellow-600",
    text: "text-yellow-600",
    darkText: "dark:text-yellow-400",
  },
  "Divine Power": {
    bg: "bg-purple-200",
    darkBg: "dark:bg-purple-950",
    indicator: "bg-gradient-to-r from-purple-500 to-purple-600",
    text: "text-purple-600",
    darkText: "dark:text-purple-400",
  },
  Focus: {
    bg: "bg-emerald-200",
    darkBg: "dark:bg-emerald-950",
    indicator: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    text: "text-emerald-600",
    darkText: "dark:text-emerald-400",
  },
  // 기본계열
  Stamina: {
    bg: "bg-slate-200",
    darkBg: "dark:bg-slate-950",
    indicator: "bg-gradient-to-r from-slate-500 to-slate-600",
    text: "text-slate-600",
    darkText: "dark:text-slate-400",
  },
  Energy: {
    bg: "bg-cyan-200",
    darkBg: "dark:bg-cyan-950",
    indicator: "bg-gradient-to-r from-cyan-500 to-cyan-600",
    text: "text-cyan-600",
    darkText: "dark:text-cyan-400",
  },
};

export function CharactersClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(
    null
  );
  const {
    data: characterData,
    error,
    isLoading,
    mutate,
  } = useSWR<CharactersResponse>("/api/characters", fetcher);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        mutate();
        toast({
          title: "캐릭터 삭제 완료",
          description: "캐릭터가 성공적으로 삭제되었습니다.",
        });
      } else {
        throw new Error("Failed to delete character");
      }
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "캐릭터 삭제 중 문제가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setDeletingCharacterId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center text-red-500">
          Error loading characters. Please try again later.
        </div>
      </div>
    );
  }

  const { characters = [], pagination } = characterData || {};

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">내 캐릭터</h1>
          <p className="text-sm text-muted-foreground">
            총 {pagination?.total}개 중 {characters.length}개 표시 중
          </p>
        </div>
        <Button
          onClick={() => router.push("/character/create")}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />새 캐릭터 만들기
        </Button>
      </div>

      <div className="space-y-3">
        {characters.map((character) => (
          <Card
            key={character._id.toString()}
            className="group relative overflow-hidden hover:bg-accent transition-colors duration-200"
          >
            <CardContent className="p-0">
              <div className="flex min-h-[140px]">
                {" "}
                {/* 고정 높이를 최소 높이로 변경 */}
                {/* Left side - Character Image */}
                <div className="w-[140px] relative overflow-hidden">
                  <img
                    src={character.profileImage}
                    alt={character.name}
                    className="h-full w-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <Badge
                    className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm"
                    variant="outline"
                  >
                    Lv. {character.level}
                  </Badge>
                </div>
                {/* Right side - Character Info */}
                <div className="flex-1 p-4 flex flex-col justify-between relative">
                  {" "}
                  {/* relative 추가 */}
                  {/* Top section */}
                  <div>
                    <div className="flex items-center gap-2">
                      <CharacterStatusSection
                        characterId={character._id.toString()}
                      />
                      <DeleteCharacterDialog
                        characterId={character._id.toString()}
                        onDelete={() => mutate()}
                      />
                    </div>
                    {/* Status bars */}
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-[100px] text-sm">HP</div>
                        <div className="flex-1">
                          <Progress
                            value={
                              (character.hp.current / character.hp.max) * 100
                            }
                            className="h-2"
                          />
                        </div>
                        <div className="w-16 text-sm text-muted-foreground text-right">
                          {character.hp.current}/{character.hp.max}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="min-w-[100px] text-sm">
                          {character.resource.name}
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={
                              (character.resource.current /
                                character.resource.max) *
                              100
                            }
                            className={cn(
                              "h-2",
                              resourceColors[character.resource.name].bg,
                              resourceColors[character.resource.name].darkBg,
                              "[&>div]:bg-gradient-to-r",
                              `[&>div]:${
                                resourceColors[character.resource.name]
                                  .indicator
                              }`
                            )}
                          />
                        </div>
                        <div
                          className={cn(
                            "w-16 text-sm text-right",
                            resourceColors[character.resource.name].text,
                            resourceColors[character.resource.name].darkText
                          )}
                        >
                          {character.resource.current}/{character.resource.max}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Bottom section - Stats */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div className="flex gap-4 opacity-100">
                      {" "}
                      {/* opacity-100 추가 */}
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {calculateAC(character)} AC
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">
                          #{character.arenaStats.rank}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Swords className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {character.arenaStats.wins}W{" "}
                          {character.arenaStats.losses}L
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-60 hover:opacity-100 transition-opacity"
                      onClick={() =>
                        router.push(`/character/${character._id.toString()}`)
                      }
                    >
                      <span className="mr-2">자세히 보기</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {characters.length === 0 && (
        <Card className="py-8">
          <div className="text-center text-muted-foreground">
            캐릭터가 없습니다. 새로운 캐릭터를 생성해보세요!
          </div>
        </Card>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <Button
              key={i}
              variant={pagination.page === i + 1 ? "default" : "outline"}
              size="sm"
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("page", String(i + 1));
                router.push(url.pathname + url.search);
              }}
            >
              {i + 1}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
