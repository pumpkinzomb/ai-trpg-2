"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  Shield,
  Swords,
  User2,
  Dumbbell,
  Brain,
  Heart,
  Crown,
  Wallet,
  UserCircle,
  Trash2,
  Plus,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Character {
  id: string;
  name: string;
  level: number;
  race: string;
  class: string;
  profileImage: string;
  experience: number;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hp: {
    current: number;
    max: number;
    hitDice: string;
  };
  equipment: {
    weapon: any;
    armor: any;
    shield: any;
  };
  arenaStats: {
    rank: number;
    rating: number;
    wins: number;
    losses: number;
  };
  resource: {
    current: number;
    max: number;
    name: string;
  };
  gold: number;
}

interface PaginationData {
  total: number;
  page: number;
  pages: number;
}

interface CharactersResponse {
  characters: Character[];
  pagination: PaginationData;
}

// AC 계산 함수 (예시 - 실제 규칙에 맞게 수정 필요)
const calculateAC = (character: Character) => {
  const baseAC = 10;
  const dexMod = Math.floor((character.stats.dexterity - 10) / 2);
  const armorBonus = character.equipment.armor ? 2 : 0; // 실제 아이템 효과로 대체 필요
  const shieldBonus = character.equipment.shield ? 2 : 0; // 실제 아이템 효과로 대체 필요
  return baseAC + dexMod + armorBonus + shieldBonus;
};

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch characters");
  return res.json();
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
        mutate(
          characterData
            ? {
                characters: characterData.characters.filter(
                  (char) => char.id !== id
                ),
                pagination: {
                  ...characterData.pagination,
                  total: characterData.pagination.total - 1,
                },
              }
            : undefined,
          false
        );
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg p-6 animate-pulse h-[400px]"
            />
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

  console.log("characters", characters);

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            내 캐릭터
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            총 {pagination?.total}개 중 {characters.length}개 표시 중
          </p>
        </div>
        <Button
          onClick={() => router.push("/character/create")}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-6 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />새 캐릭터 만들기
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.map((character) => (
          <div
            key={character.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <div className="relative">
              {character.profileImage ? (
                <img
                  src={character.profileImage}
                  alt={character.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-20 h-20 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <AlertDialog
                  open={deletingCharacterId === character.id}
                  onOpenChange={(open) => {
                    if (!open) setDeletingCharacterId(null);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setDeletingCharacterId(character.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        정말 삭제하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 캐릭터와 관련된 모든
                        데이터가 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(character.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {character.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Level {character.level} {character.race} {character.class}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-1 rounded mb-1">
                    Lvl {character.level}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    EXP: {character.experience}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Shield className="w-4 h-4" />
                  <span>AC: {calculateAC(character)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      HP: {character.hp.current}/{character.hp.max}
                    </div>
                    <Progress
                      value={(character.hp.current / character.hp.max) * 100}
                      className="h-2 bg-red-100 dark:bg-red-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {character.resource.name}: {character.resource.current}/
                      {character.resource.max}
                    </div>
                    <Progress
                      value={
                        (character.resource.current / character.resource.max) *
                        100
                      }
                      className="h-2 bg-purple-100 dark:bg-purple-950"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Wallet className="w-4 h-4 text-yellow-600" />
                  <span>{character.gold} GP</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <Dumbbell className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400" />
                  <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    STR {character.stats.strength}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <User2 className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400" />
                  <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    DEX {character.stats.dexterity}
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <Heart className="w-4 h-4 mx-auto text-gray-600 dark:text-gray-400" />
                  <div className="text-sm mt-1 text-gray-700 dark:text-gray-300">
                    CON {character.stats.constitution}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Crown className="w-4 h-4 text-yellow-600" />
                  <span>Rank {character.arenaStats.rank}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                  <Swords className="w-4 h-4" />
                  <span>
                    {character.arenaStats.wins}W {character.arenaStats.losses}L
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={() => router.push(`/characters/${character.id}`)}
                >
                  자세히 보기 →
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {characters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No characters found. Create your first character!
          </p>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("page", String(i + 1));
                router.push(url.pathname + url.search);
              }}
              className={`px-3 py-1 rounded ${
                pagination.page === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
