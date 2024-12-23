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
import { RewardDialog } from "./RewardDialog";
import { Loader2, Timer, Coins, Dice6 } from "lucide-react";

interface Character {
  _id: string;
  name: string;
  level: number;
  gold: number;
}

interface CharacterStatus {
  characterId: string;
  status: {
    dungeon: {
      isActive: boolean;
      dungeonId?: string;
      startTime?: string;
      endTime?: string;
    };
    labor: {
      isActive: boolean;
      startTime?: string;
      endTime?: string;
      reward?: number;
    };
  };
  lastUpdated: string;
}

interface LaborClientProps {
  laborImage: string | null;
}

export function LaborClient({ laborImage }: LaborClientProps) {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [characterStatuses, setCharacterStatuses] = useState<
    Map<string, CharacterStatus>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);

  const getCharacterId = (character: Character) => character._id.toString();

  useEffect(() => {
    const initializeData = async () => {
      try {
        // 1. 먼저 캐릭터 목록을 가져옴
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data.characters);

        // 2. 캐릭터 상태를 Promise.all로 한번에 요청
        const statusPromises = data.characters.map((character: Character) =>
          fetch(`/api/characters/status?characterId=${character._id}`).then(
            (res) => res.json()
          )
        );

        const characterStatuses = await Promise.all(statusPromises);

        // 3. 상태 Map 업데이트
        const statusMap = new Map();
        characterStatuses.forEach((statusData, index) => {
          if (statusData.success) {
            statusMap.set(data.characters[index]._id, statusData.status);
          }
        });
        setCharacterStatuses(statusMap);

        // 4. 노역 중인 첫 번째 캐릭터 찾기
        const laboringCharacter = data.characters.find(
          (char: Character) => statusMap.get(char._id)?.status.labor.isActive
        );

        if (laboringCharacter) {
          setSelectedCharacter(laboringCharacter);
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "오류",
          description: "데이터를 불러오는데 실패했습니다.",
        });
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    if (selectedCharacter) {
      const characterId = getCharacterId(selectedCharacter);
      const status = characterStatuses.get(characterId);
      if (status?.status.labor.isActive) {
        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedCharacter, characterStatuses]);

  const updateTimeLeft = () => {
    if (!selectedCharacter) return;

    const characterId = getCharacterId(selectedCharacter);
    const laborStatus = characterStatuses.get(characterId)?.status.labor;
    if (!laborStatus?.isActive || !laborStatus.endTime) {
      setTimeLeft(null);
      return;
    }

    const endTime = new Date(laborStatus.endTime).getTime();
    const now = new Date().getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      setTimeLeft(0);
    } else {
      setTimeLeft(Math.ceil(difference / 1000));
    }
  };

  const fetchCharacterStatus = async (characterId: string) => {
    try {
      const response = await fetch(
        `/api/characters/status?characterId=${characterId}`
      );
      const data = await response.json();
      if (data.success) {
        setCharacterStatuses((prev) =>
          new Map(prev).set(characterId, data.status)
        );
      }
    } catch (error) {
      console.error("Failed to fetch character status:", error);
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters);

      // 모든 캐릭터의 상태를 가져옴
      const statusPromises = data.characters.map(
        async (character: Character) => {
          const statusResponse = await fetch(
            `/api/characters/status?characterId=${character._id}`
          );
          const statusData = await statusResponse.json();
          return {
            character, // character 정보도 함께 저장
            status: statusData.status,
          };
        }
      );

      const characterStatuses = await Promise.all(statusPromises);

      // 상태 Map 업데이트
      const statusMap = new Map();
      characterStatuses.forEach(({ character, status }) => {
        statusMap.set(character._id, status);
      });
      setCharacterStatuses(statusMap);

      // 노역 중인 첫 번째 캐릭터 찾기
      const laboringCharacter = characterStatuses.find(
        ({ status }) => status.status.labor.isActive
      )?.character;

      // 노역 중인 캐릭터가 있으면 선택
      if (laboringCharacter) {
        setSelectedCharacter(laboringCharacter);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "캐릭터 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const calculateBaseReward = (level: number) => {
    return Math.floor(300 + level * 15); // 기본 100골드 + 레벨당 15골드
  };

  const startLabor = async () => {
    if (!selectedCharacter) return;

    const characterId = getCharacterId(selectedCharacter);
    const currentStatus = characterStatuses.get(characterId);

    if (
      currentStatus?.status.dungeon.isActive ||
      currentStatus?.status.labor.isActive
    ) {
      toast({
        variant: "destructive",
        title: "노역 불가",
        description: "캐릭터가 다른 활동 중입니다.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);
      const baseReward = calculateBaseReward(selectedCharacter.level);

      const response = await fetch("/api/characters/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
          statusType: "labor",
          data: {
            isActive: true,
            startTime,
            endTime,
            reward: baseReward,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCharacterStatuses((prev) =>
          new Map(prev).set(characterId, data.status)
        );
        toast({
          title: "노역 시작",
          description: `${selectedCharacter.name}이(가) 노역을 시작했습니다.`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "노역을 시작하는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollectAndRest = async (
    finalReward: number,
    finalExp: number
  ) => {
    if (!selectedCharacter) return;
    setIsLoading(true);
    try {
      // 상태 초기화
      const response = await fetch("/api/characters/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: selectedCharacter._id.toString(),
          statusType: "labor",
          data: {
            isActive: false,
            startTime: null,
            endTime: null,
            reward: null,
          },
        }),
      });

      if (response.ok) {
        // 골드와 경험치 지급
        const rewardResponse = await fetch("/api/characters/reward", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            characterId: selectedCharacter._id.toString(),
            gold: finalReward,
            experience: finalExp,
          }),
        });

        const rewardData = await rewardResponse.json();

        await Promise.all([
          fetchCharacterStatus(selectedCharacter._id.toString()),
          fetchCharacters(),
        ]);

        toast({
          title: "보상 수령 완료",
          description: `${finalReward} 골드와 ${finalExp} 경험치를 획득했습니다!${
            rewardData.levelUp ? " 레벨업!" : ""
          }`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "보상을 수령하는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
      setShowRewardDialog(false);
    }
  };

  const handleCollectAndContinue = async (finalReward: number) => {
    if (!selectedCharacter) return;
    setIsLoading(true);
    try {
      // 보상 지급 및 새로운 노역 시작
      const response = await fetch("/api/characters/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId: getCharacterId(selectedCharacter),
          statusType: "labor",
          data: {
            isActive: true,
            startTime: new Date(),
            endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
            reward: calculateBaseReward(selectedCharacter.level),
          },
        }),
      });

      if (response.ok) {
        // 골드 지급
        await fetch("/api/characters/reward", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            characterId: selectedCharacter._id.toString(),
            gold: finalReward,
          }),
        });

        await Promise.all([
          fetchCharacterStatus(selectedCharacter._id.toString()),
          fetchCharacters(),
        ]);

        toast({
          title: "보상 수령 및 노역 재시작",
          description: `${finalReward} 골드를 획득하고 새로운 노역을 시작했습니다!`,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "처리 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
      setShowRewardDialog(false);
    }
  };

  const isLaborCompleted = () => {
    if (!selectedCharacter) return false;
    const characterId = getCharacterId(selectedCharacter);
    const laborStatus = getCharacterLaborStatus(characterId, characterStatuses);

    if (!laborStatus?.isActive || !laborStatus.endTime) return false;

    const endTime = new Date(laborStatus.endTime).getTime();
    const now = new Date().getTime();
    return now >= endTime;
  };

  const isCharacterAvailable = (characterId: string) => {
    const status = getCharacterStatus(characterId, characterStatuses);
    return !status?.status.dungeon.isActive;
  };

  const getCharacterStatus = (
    characterId: string,
    statuses: Map<string, CharacterStatus>
  ) => statuses.get(characterId);

  const getCharacterLaborStatus = (
    characterId: string,
    statuses: Map<string, CharacterStatus>
  ) => {
    const status = getCharacterStatus(characterId, statuses);
    return status?.status.labor;
  };

  const getCharacterStatusText = (characterId: string) => {
    const status = getCharacterStatus(characterId, characterStatuses);
    if (!status) return null;
    if (status.status.dungeon.isActive) return "던전 탐험 중";
    if (status.status.labor.isActive) return "노역 중";
    return null;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}시간 ${minutes}분 ${secs}초`;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="relative">
        {/* 상단 제목 섹션 */}
        <div className="text-center space-y-4 relative z-10">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-amber-700">
            혹독한 노동의 현장
          </h1>
          <p className="text-muted-foreground">
            피와 땀으로 벌어들이는 골드. 고된 노동은 당신을 더 강하게 만들
            것입니다.
          </p>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 노동 현장 이미지 */}
          <div className="space-y-6">
            {laborImage && (
              <div className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/5">
                  <img
                    src={laborImage}
                    alt="Labor"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground italic text-center">
                    "금은 대지의 깊은 곳에서, 보상은 고된 노동 속에서 찾을 수
                    있노라. 인내하라, 그대의 땀은 반드시 금빛으로 빛날 것이니."
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 캐릭터 선택 & 노역 인터페이스 */}
          <Card className="p-6">
            <div className="space-y-6">
              {/* 캐릭터 선택 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  노동할 캐릭터 선택
                </label>
                <Select
                  value={
                    selectedCharacter
                      ? getCharacterId(selectedCharacter)
                      : undefined
                  }
                  onValueChange={(value) => {
                    const character = characters.find(
                      (char) => getCharacterId(char) === value
                    );
                    setSelectedCharacter(character || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="캐릭터를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map((character) => {
                      const characterId = getCharacterId(character);
                      return (
                        <SelectItem
                          key={characterId}
                          value={characterId}
                          disabled={!isCharacterAvailable(characterId)}
                        >
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {character.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                Lv.{character.level}
                              </span>
                            </div>
                            {getCharacterStatusText(
                              character._id.toString()
                            ) && (
                              <span className="text-xs text-yellow-500 font-medium shrink-0">
                                {getCharacterStatusText(
                                  character._id.toString()
                                )}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* 선택된 캐릭터 정보와 상태 표시 */}
              {selectedCharacter && (
                <div className="space-y-4">
                  {/* 예상 보상 정보 - 노동 진행 중일 때 */}
                  {getCharacterLaborStatus(
                    getCharacterId(selectedCharacter),
                    characterStatuses
                  )?.isActive && timeLeft !== 0 ? (
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">예상 보상:</span>
                        <span className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          {calculateBaseReward(selectedCharacter.level)} Gold
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        * 3시간의 노동이 끝나면 보상을 수령할 수 있습니다
                      </div>
                    </div>
                  ) : timeLeft === 0 ? (
                    // 노동 완료 후 보상 수령 시점
                    <>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">확실한 보상:</span>
                        <span className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          {calculateBaseReward(selectedCharacter.level)} Gold
                        </span>
                      </div>

                      <div className="mt-3 p-3 bg-black/5 rounded-lg border border-dashed border-yellow-500/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Dice6 className="h-5 w-5 text-yellow-500" />
                          <span className="font-semibold text-yellow-500">
                            도전해보시겠습니까?
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          "운이 좋다면 두 배의 보상을... 하지만 운이
                          나쁘다면..."
                          <br />
                          상인이 장난스러운 미소와 함께 주사위를 건넵니다.
                        </p>
                      </div>

                      <div className="text-xs text-muted-foreground italic">
                        * 주사위의 결과에 따라 보상이 크게 달라질 수 있습니다
                      </div>
                    </>
                  ) : null}

                  {/* 작업 상태 및 타이머 */}
                  {getCharacterLaborStatus(
                    getCharacterId(selectedCharacter),
                    characterStatuses
                  )?.isActive ? (
                    <div className="space-y-4">
                      {timeLeft !== null && (
                        <>
                          <div className="flex items-center justify-center gap-2 text-lg">
                            <Timer className="h-5 w-5" />
                            <span>
                              {timeLeft > 0
                                ? `남은 시간: ${formatTime(timeLeft)}`
                                : "작업이 완료되었습니다!"}
                            </span>
                          </div>
                          <Progress
                            value={
                              ((3 * 60 * 60 - Math.max(0, timeLeft)) /
                                (3 * 60 * 60)) *
                              100
                            }
                            className="h-2"
                          />
                        </>
                      )}

                      {/* 보상 수령 버튼 영역 수정 */}
                      {timeLeft === 0 && (
                        <div className="space-y-3">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={async () => {
                              const baseReward = calculateBaseReward(
                                selectedCharacter?.level || 0
                              );
                              const baseExp = Math.floor(baseReward * 0.1);
                              await handleCollectAndRest(baseReward, baseExp);
                            }}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                처리 중...
                              </>
                            ) : (
                              <>
                                <Coins className="mr-2 h-4 w-4" />
                                안전하게 보상 수령하기 (
                                {calculateBaseReward(
                                  selectedCharacter?.level || 0
                                )}{" "}
                                Gold +{" "}
                                {Math.floor(
                                  calculateBaseReward(
                                    selectedCharacter?.level || 0
                                  ) * 0.1
                                )}{" "}
                                EXP)
                              </>
                            )}
                          </Button>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-background px-2 text-muted-foreground">
                                또는
                              </span>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-yellow-600 hover:bg-yellow-700"
                            onClick={() => setShowRewardDialog(true)}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                처리 중...
                              </>
                            ) : (
                              <>
                                <Dice6 className="mr-2 h-4 w-4" />
                                도박으로 더 많은 보상 노리기!
                              </>
                            )}
                          </Button>

                          <div className="mt-1 space-y-1">
                            <div className="text-xs text-yellow-600 text-center italic">
                              * 주사위 결과에 따라 0%~200% 사이의 보상을 받게
                              됩니다
                            </div>
                            <div className="text-xs text-red-500 text-center">
                              ⚠️ 대실패 시 모든 보상을 잃을 수 있습니다!
                            </div>
                          </div>
                        </div>
                      )}

                      {typeof timeLeft === "number" && timeLeft > 0 && (
                        <Button className="w-full" disabled={true}>
                          작업 진행 중...
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={startLabor}
                      disabled={
                        isLoading ||
                        !isCharacterAvailable(selectedCharacter._id.toString())
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        "노동 시작하기"
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
      <RewardDialog
        open={showRewardDialog}
        onOpenChange={setShowRewardDialog}
        baseReward={calculateBaseReward(selectedCharacter?.level || 0)}
        onCollectAndRest={handleCollectAndRest}
        onCollectAndContinue={handleCollectAndContinue}
      />
    </div>
  );
}
