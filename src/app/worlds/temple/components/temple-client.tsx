"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface Character {
  _id: string;
  name: string;
  level: number;
  gold: number;
  hp: {
    current: number;
    max: number;
  };
  resource: {
    current: number;
    max: number;
    name: string;
  };
}

interface TempleClientProps {
  templeImage: string | null;
}

export function TempleClient({ templeImage }: TempleClientProps) {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charactersInDungeon, setCharactersInDungeon] = useState<Set<string>>(
    new Set()
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  // 치료 비용 계산 함수
  const calculateHealingCost = (level: number) => {
    // 기본 비용 50골드에 레벨당 10골드씩 추가
    return 50 + (level - 1) * 10;
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const checkDungeonStatus = async (characters: Character[]) => {
    try {
      const dungeonStatuses = await Promise.all(
        characters.map(async (character) => {
          const response = await fetch(
            `/api/dungeon/active?characterId=${character._id}`
          );
          const data = await response.json();
          return {
            characterId: character._id.toString(),
            inDungeon: !!data.dungeon,
          };
        })
      );

      const inDungeonIds = new Set(
        dungeonStatuses
          .filter((status) => status.inDungeon)
          .map((status) => status.characterId)
      );
      setCharactersInDungeon(inDungeonIds);
    } catch (error) {
      console.error("Failed to check dungeon status:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "캐릭터 상태 확인에 실패했습니다.",
      });
    }
  };

  // 캐릭터의 치료 필요 여부를 확인하는 함수
  const needsHealing = (character: Character) => {
    return (
      character.hp.current < character.hp.max ||
      character.resource.current < character.resource.max
    );
  };

  // 치료 가능 여부를 확인하는 함수 (골드 포함)
  const canBeHealed = (character: Character) => {
    const healingCost = calculateHealingCost(character.level);
    return (
      needsHealing(character) &&
      character.gold >= healingCost &&
      !charactersInDungeon.has(character._id.toString())
    );
  };

  // 치료 버튼의 상태 메시지를 반환하는 함수
  const getHealingButtonMessage = (character: Character) => {
    if (charactersInDungeon.has(character._id.toString())) {
      return "던전 탐험 중인 캐릭터는 이용할 수 없습니다";
    }
    if (!needsHealing(character)) {
      return "치료가 필요하지 않습니다";
    }
    const healingCost = calculateHealingCost(character.level);
    if (character.gold < healingCost) {
      return "골드가 부족합니다";
    }
    return "치료하기";
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters);
      await checkDungeonStatus(data.characters);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "캐릭터 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const handleHeal = async () => {
    if (!selectedCharacter) return;

    if (charactersInDungeon.has(selectedCharacter._id.toString())) {
      toast({
        variant: "destructive",
        title: "치료 불가",
        description: "던전 탐험 중인 캐릭터는 신전을 이용할 수 없습니다.",
      });
      return;
    }

    // 치료가 필요없는 경우 처리
    if (!needsHealing(selectedCharacter)) {
      toast({
        title: "치료 불필요",
        description: "이미 최대 체력과 자원을 보유하고 있습니다.",
        variant: "default",
      });
      return;
    }

    const healingCost = calculateHealingCost(selectedCharacter.level);

    if (selectedCharacter.gold < healingCost) {
      toast({
        variant: "destructive",
        title: "골드 부족",
        description: "치료 비용이 부족합니다.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/characters/heal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: selectedCharacter._id,
          healingCost,
        }),
      });

      if (!response.ok) throw new Error("Healing failed");

      const updatedCharacter = await response.json();
      setCharacters(
        characters.map((char) =>
          char._id === updatedCharacter._id ? updatedCharacter : char
        )
      );
      setSelectedCharacter(updatedCharacter);

      toast({
        title: "치료 완료",
        description: `${updatedCharacter.name}의 체력과 ${updatedCharacter.resource.name}가 회복되었습니다.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "치료에 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="relative">
        {/* 상단 제목 섹션 */}
        <div className="text-center space-y-4 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-600">
            신성한 치유의 신전
          </h1>
          <p className="text-muted-foreground">
            신의 축복으로 당신의 상처를 치유하고 영혼을 회복하세요
          </p>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 신전 이미지 & 분위기 */}
          <div className="space-y-6">
            {templeImage && (
              <div className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/5">
                  <img
                    src={templeImage}
                    alt="Temple"
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground italic text-center">
                    "빛나는 스테인드글라스 창을 통해 들어오는 성스러운 빛이
                    당신의 지친 영혼을 감싸안습니다. 이곳에서 당신은 새로운
                    희망과 치유를 발견할 수 있을 것입니다."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 캐릭터 선택 & 치료 인터페이스 */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                {/* 캐릭터 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">캐릭터 선택</label>
                  <Select
                    onValueChange={(value) =>
                      setSelectedCharacter(
                        characters.find((char) => char._id === value) || null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="치료할 캐릭터를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => {
                        const inDungeon = charactersInDungeon.has(
                          character._id.toString()
                        );
                        return (
                          <SelectItem
                            key={character._id}
                            value={character._id}
                            disabled={inDungeon}
                          >
                            <div className="flex items-center gap-2">
                              <span>
                                {character.name} (Lv.{character.level})
                              </span>
                              {inDungeon && (
                                <span className="text-xs text-red-500">
                                  (던전 탐험 중)
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* 선택된 캐릭터 정보 */}
                {selectedCharacter &&
                  charactersInDungeon.has(selectedCharacter._id.toString()) && (
                    <div className="mt-2 text-sm text-red-500">
                      던전 탐험 중인 캐릭터는 신전을 이용할 수 없습니다.
                    </div>
                  )}
                {selectedCharacter && (
                  <div className="space-y-4">
                    {/* HP 바 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>HP</span>
                        <span
                          className={
                            selectedCharacter.hp.current ===
                            selectedCharacter.hp.max
                              ? "text-green-500"
                              : ""
                          }
                        >
                          {selectedCharacter.hp.current} /{" "}
                          {selectedCharacter.hp.max}
                        </span>
                      </div>
                      <Progress
                        value={
                          (selectedCharacter.hp.current /
                            selectedCharacter.hp.max) *
                          100
                        }
                        className={`h-2 ${
                          selectedCharacter.hp.current ===
                          selectedCharacter.hp.max
                            ? "bg-green-100"
                            : ""
                        }`}
                      />
                    </div>

                    {/* 리소스 바 */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{selectedCharacter.resource.name}</span>
                        <span
                          className={
                            selectedCharacter.resource.current ===
                            selectedCharacter.resource.max
                              ? "text-green-500"
                              : ""
                          }
                        >
                          {selectedCharacter.resource.current} /{" "}
                          {selectedCharacter.resource.max}
                        </span>
                      </div>
                      <Progress
                        value={
                          (selectedCharacter.resource.current /
                            selectedCharacter.resource.max) *
                          100
                        }
                        className={`h-2 ${
                          selectedCharacter.resource.current ===
                          selectedCharacter.resource.max
                            ? "bg-green-100"
                            : ""
                        }`}
                      />
                    </div>

                    {/* 골드 정보 */}
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span>
                          치료 비용:{" "}
                          {calculateHealingCost(selectedCharacter.level)} Gold
                        </span>
                        <span
                          className={
                            selectedCharacter.gold <
                            calculateHealingCost(selectedCharacter.level)
                              ? "text-red-500"
                              : ""
                          }
                        >
                          보유 골드: {selectedCharacter.gold} Gold
                        </span>
                      </div>
                    </div>

                    {/* 치료 버튼 */}
                    <Button
                      className="w-full"
                      onClick={handleHeal}
                      disabled={isLoading || !canBeHealed(selectedCharacter)}
                      variant={
                        needsHealing(selectedCharacter) ? "default" : "outline"
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          치료 중...
                        </>
                      ) : (
                        getHealingButtonMessage(selectedCharacter)
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
