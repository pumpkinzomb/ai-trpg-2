"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Character,
  DungeonState,
  DungeonLog,
  Item,
  UsedItem,
} from "@/app/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DungeonCombat from "./DungeonCombat";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2, SkullIcon, Swords } from "lucide-react";
import { DungeonHeader } from "./DungeonHeader";
import { DungeonActionInput } from "./DungeonActionInput";
import { DungeonRewards } from "./DungeonRewards";
import { DungeonLogs } from "./DungeonLogs";
import { DungeonLoading } from "./DungeonLoading";
import { CharacterSelect } from "./CharacterSelect";
import { TrapDiscoveryCard } from "./TrapDiscoveryCard";
import StatusResult from "./StatusResult";
import {
  ConfirmDeleteDialog,
  EscapeConfirmDialog,
  EscapeResultsDialog,
  LootWarningDialog,
  CompleteConfirmDialog,
  LogDetailDialog,
  TrapDialog,
  TrapResolution,
} from "./DungeonDialogs";
import { CharacterDeathCard } from "./CharacterDeathCard";

type LoadingState = {
  init: boolean; // 초기 캐릭터 로딩
  dungeon: boolean; // 던전 초기화
  action: boolean; // 액션 처리
};

interface EscapePenalties {
  lostGold: number;
  lostItems: Array<{
    itemId: string;
    logId: string;
    name?: string;
  }>;
  savedItems: Array<{
    itemId: string;
    logId: string;
    name?: string;
  }>;
}

interface CharacterStatus {
  characterId: string;
  status: {
    dungeon: {
      isActive: boolean;
    };
    labor: {
      isActive: boolean;
    };
  };
}

export function DungeonClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [characterStatuses, setCharacterStatuses] = useState<
    Map<string, CharacterStatus>
  >(new Map());

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    logIndex: number;
    description: string;
  } | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    init: true,
    dungeon: false,
    action: false,
  });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [dungeonState, setDungeonState] = useState<DungeonState | null>(null);
  const [userAction, setUserAction] = useState("");
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showEscapeConfirm, setShowEscapeConfirm] = useState(false);
  const [showLootWarning, setShowLootWarning] = useState(false);
  const [showLogDialog, setShowLogDialog] = useState<{
    id: string;
    log: DungeonLog;
  } | null>(null);
  const [escapeResults, setEscapeResults] = useState<EscapePenalties | null>(
    null
  );
  const [showEscapeResults, setShowEscapeResults] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [combatProcessing, setCombatProcessing] = useState(false);
  const [showTrapDialog, setShowTrapDialog] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [CharacterDead, setCharacterDead] = useState<{
    dead: boolean;
    cause?: "trap" | "combat";
  }>({ dead: false });
  const [initiativeOrder, setInitiativeOrder] = useState<
    Array<{
      name: string;
      isPlayer: boolean;
      enemyIndex?: number;
    }>
  >([]);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      if (!response.ok) throw new Error("Failed to fetch characters");
      const data = await response.json();
      setCharacters(data.characters);

      // 캐릭터 상태 가져오기
      const statusPromises = data.characters.map(
        async (character: Character) => {
          const statusResponse = await fetch(
            `/api/characters/status?characterId=${character._id.toString()}`
          );
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            return {
              character,
              status: statusData.status,
            };
          }
          return null;
        }
      );

      const characterStatuses = (await Promise.all(statusPromises)).filter(
        Boolean
      );

      // 상태 Map 업데이트
      const statusMap = new Map();
      characterStatuses.forEach(({ character, status }) => {
        statusMap.set(character._id.toString(), status);
      });
      setCharacterStatuses(statusMap);

      // 던전에 진입한 캐릭터 찾기
      const dungeonCharacters = characterStatuses.filter(
        ({ status }) => status.status.dungeon.isActive
      );

      // 던전에 진입한 캐릭터가 정확히 1명이면 자동 선택
      if (dungeonCharacters.length === 1) {
        const dungeonCharacter = dungeonCharacters[0].character;
        setSelectedCharacter(dungeonCharacter);
        await initializeDungeon(dungeonCharacter._id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "캐릭터 목록을 불러오는데 실패했습니다.",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, init: false }));
    }
  };

  const isCharacterAvailable = (characterId: string) => {
    const status = characterStatuses.get(characterId);
    if (!status) return true;
    return !status.status.labor.isActive;
  };

  const getCharacterStatusText = (characterId: string) => {
    const status = characterStatuses.get(characterId);
    if (!status) return null;
    if (status.status.labor.isActive) return "노역 중";
    return null;
  };

  const initializeDungeon = async (characterId: string) => {
    try {
      setLoadingState((prev) => ({ ...prev, dungeon: true }));

      // 1. 먼저 활성화된 던전이 있는지 확인
      const activeResponse = await fetch(
        `/api/dungeon/active?characterId=${characterId}`
      );
      if (!activeResponse.ok) {
        throw new Error("Failed to check active dungeon");
      }

      const activeData = await activeResponse.json();

      // 활성화된 던전이 있으면 해당 던전을 로드
      if (activeData.dungeon) {
        setDungeonState(activeData.dungeon);
        if (activeData.dungeon.playerHP <= 0) {
          setCharacterDead({
            dead: true,
            cause: determineDeathCause(activeData.dungeon.logs),
          });
        }
        return;
        return;
      }

      // 활성화된 던전이 없으면 새로운 던전 생성
      const response = await fetch("/api/dungeon/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to initialize dungeon");
      }

      const data = await response.json();
      setDungeonState(data.dungeon);
    } catch (error) {
      console.error("Failed to initialize/load dungeon:", error);
      toast({
        variant: "destructive",
        title: "던전 초기화 실패",
        description: "던전을 초기화하는데 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, dungeon: false }));
    }
  };

  const handleCharacterSelect = async (character: Character) => {
    setSelectedCharacter(character);
    await initializeDungeon(character._id.toString());
    setShowCharacterSelect(false);
  };

  const handleActionSubmit = async () => {
    if (
      !userAction.trim() ||
      loadingState.action ||
      !selectedCharacter ||
      !dungeonState
    )
      return;

    // 현재 로그에 루팅하지 않은 보상이 있는지 확인
    const currentLog = getCurrentLog();
    if (currentLog && hasUnlootedRewards(currentLog)) {
      setShowLootWarning(true);
      return;
    }

    setLoadingState((prev) => ({ ...prev, action: true }));
    try {
      const response = await fetch("/api/dungeon/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: userAction,
          dungeonId: dungeonState._id.toString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to process action");
      const updatedDungeon = await response.json();
      setDungeonState(updatedDungeon);
      setUserAction("");
    } catch (error) {
      console.error("Failed to process action:", error);
      toast({
        variant: "destructive",
        title: "액션 처리 실패",
        description: "행동을 처리하는데 실패했습니다. 다시 시도해주세요.",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, action: false }));
    }
  };

  const determineDeathCause = (logs: DungeonLog[]): "combat" | "trap" => {
    // 마지막 로그부터 역순으로 확인
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];

      // 전투 로그 확인
      if (log.data?.combat?.resolved && !log.data.combat.resolution?.victory) {
        return "combat";
      }

      // 함정 로그 확인
      if (log.data?.trap?.resolved && !log.data.trap.resolution?.success) {
        return "trap";
      }
    }

    // 기본값은 전투로 설정
    return "combat";
  };

  // 루팅 가능한 아이템이나 골드가 있는지 확인하는 함수
  const hasUnlootedRewards = (log: DungeonLog) => {
    if (!log.data?.rewards) return false;

    const hasUnlootedGold =
      log.data.rewards.gold > 0 && !log.data.rewards.goldLooted;
    const hasUnlootedItems = log.data.rewards.items?.some(
      (item) =>
        !isItemLootedFromSpecificLog(
          item._id.toString(),
          log._id.toString(),
          dungeonState!
        )
    );

    return hasUnlootedGold || hasUnlootedItems;
  };

  const handleEscape = async () => {
    if (!selectedCharacter || !dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/escape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter._id.toString(),
          dungeonId: dungeonState._id.toString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to escape");
      const data = await response.json();

      if (data.penalties) {
        setEscapeResults(data.penalties);
        // 결과 다이얼로그 표시
        setShowEscapeResults(true);
      } else {
        // 바로 마을로 이동
        router.push("/worlds/town");
      }
    } catch (error) {
      console.error("Failed to escape:", error);
      toast({
        variant: "destructive",
        title: "탈출 실패",
        description: "던전을 탈출하는데 실패했습니다.",
      });
    }
  };

  const handleLootGold = async (logId: string) => {
    if (!dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/loot-gold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonId: dungeonState._id.toString(),
          logId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to loot gold");
      }

      const updatedDungeon = await response.json();
      setDungeonState(updatedDungeon);

      toast({
        title: "골드 획득",
        description: "골드를 성공적으로 획득했습니다.",
      });
    } catch (error) {
      console.error("Failed to loot gold:", error);
      toast({
        variant: "destructive",
        title: "골드 획득 실패",
        description:
          error instanceof Error
            ? error.message
            : "골드를 획득하는데 실패했습니다.",
      });
    }
  };

  const handleLoot = async (itemId: string, logId: string) => {
    if (!dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/loot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonId: dungeonState._id.toString(),
          itemId,
          logId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to loot item");
      }

      const updatedDungeon = await response.json();
      setDungeonState(updatedDungeon);

      // 현재 로그에서 아이템 정보 찾기
      const currentLog = updatedDungeon.logs[updatedDungeon.logs.length - 1];
      const lootedItem = currentLog.data?.rewards?.items?.find(
        (item: Item) => item._id.toString() === itemId
      );

      toast({
        title: "아이템 획득",
        description: `${lootedItem?.name || "아이템"}을(를) 획득했습니다.`,
      });
    } catch (error) {
      console.error("Failed to loot item:", error);
      toast({
        variant: "destructive",
        title: "아이템 획득 실패",
        description:
          error instanceof Error
            ? error.message
            : "아이템을 획득하는데 실패했습니다.",
      });
    }
  };

  const handleDeleteLog = async (logIndex: number) => {
    if (!dungeonState || logIndex === 0) return;

    try {
      const response = await fetch(
        `/api/dungeon/${dungeonState._id}/logs?index=${logIndex}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete log");
      }

      const { logs, temporaryInventory } = await response.json();

      setDungeonState((prevState) => {
        if (!prevState) return null;

        return {
          ...prevState,
          logs,
          temporaryInventory,
          updatedAt: new Date(),
        };
      });

      setShowDeleteConfirm(null);

      toast({
        title: "로그 삭제",
        description: "선택한 로그가 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Failed to delete log:", error);
      toast({
        variant: "destructive",
        title: "로그 삭제 실패",
        description:
          error instanceof Error
            ? error.message
            : "로그를 삭제하는데 실패했습니다.",
      });
    }
  };

  const handleCompleteDungeon = async () => {
    if (!selectedCharacter || !dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter._id.toString(),
          dungeonId: dungeonState._id.toString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to complete dungeon");
      const data = await response.json();

      toast({
        title: "던전 완료",
        description: `축하합니다! 던전을 성공적으로 공략했습니다. (획득 경험치: ${data.rewards.xp})`,
      });

      router.push("/worlds/town");
    } catch (error) {
      console.error("Failed to complete dungeon:", error);
      toast({
        variant: "destructive",
        title: "던전 완료 실패",
        description: "던전 완료 처리에 실패했습니다.",
      });
    }
  };

  const handleDungeonFail = async () => {
    if (!selectedCharacter || !dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter._id.toString(),
          dungeonId: dungeonState._id.toString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to process dungeon failure");
      const data = await response.json();

      // 페널티 결과 표시
      if (data.penalties) {
        setEscapeResults(data.penalties);
        setShowEscapeResults(true);
      }

      // 신전으로 리다이렉트
      router.push("/worlds/temple");
    } catch (error) {
      console.error("Failed to process dungeon failure:", error);
      toast({
        variant: "destructive",
        title: "처리 실패",
        description: "던전 실패 처리 중 오류가 발생했습니다.",
      });
    }
  };

  const handleCombatEnd = async (result: {
    victory: boolean;
    remainingHp: number;
    usedItems: UsedItem[];
  }) => {
    if (!dungeonState || !selectedCharacter) return;

    try {
      setCombatProcessing(true);

      const response = await fetch("/api/dungeon/combat-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonId: dungeonState._id.toString(),
          characterId: selectedCharacter._id.toString(),
          result: {
            victory: result.victory,
            remainingHp: result.remainingHp,
            usedItems: result.usedItems,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to process combat result");
      const data = await response.json();

      // 던전 상태 업데이트
      setDungeonState(data.dungeon);

      if (!result.victory) {
        setCharacterDead({ dead: true, cause: "combat" });
        toast({
          variant: "destructive",
          title: "치명상",
          description: "전투에서 치명상을 입었습니다.",
        });
      } else {
        toast({
          title: "전투 승리",
          description: "전투에서 승리했습니다!",
        });
      }

      setShowCombat(false);
    } catch (error) {
      console.error("Failed to process combat result:", error);
      toast({
        variant: "destructive",
        title: "전투 결과 처리 실패",
        description: "전투 결과를 처리하는데 실패했습니다.",
      });
    } finally {
      setCombatProcessing(false);
    }
  };

  const handleTrapRollEnd = async (result: TrapResolution) => {
    if (!dungeonState || !selectedCharacter) return;

    const currentLog = getCurrentLog();
    if (!currentLog?.data?.trap) return;

    try {
      const response = await fetch("/api/dungeon/trap-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonId: dungeonState._id.toString(),
          logId: currentLog._id.toString(),
          result: {
            success: result.success,
            roll: result.roll,
            damage: result.damage,
            description: result.description,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to process trap result");
      const data = await response.json();
      setDungeonState(data.dungeon);

      toast({
        title: result.success ? "함정 회피 성공!" : "함정 회피 실패",
        description: result.description,
        variant: result.success ? "default" : "destructive",
      });

      if (!result.success && dungeonState.playerHP - result.damage <= 0) {
        setCharacterDead({ dead: true, cause: "trap" });
      }

      // 트랩 처리가 완료되면 다이얼로그 닫기
      setShowTrapDialog(false);
    } catch (error) {
      console.error("Failed to process trap result:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "함정 결과를 처리하는데 실패했습니다.",
      });
    }
  };

  // 능력치 수정치 계산 함수 추가
  const getAbilityModifier = (character: Character, abilityType: string) => {
    const abilityScores = {
      strength: character.stats.strength,
      dexterity: character.stats.dexterity,
      constitution: character.stats.constitution,
      intelligence: character.stats.intelligence,
      wisdom: character.stats.wisdom,
    };

    const score =
      abilityScores[abilityType as keyof typeof abilityScores] || 10;
    return Math.floor((score - 10) / 2);
  };

  // 캐릭터가 없는 경우
  if (!loadingState.init && characters.length === 0) {
    return (
      <div className="container mx-auto py-20">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle>모험할 캐릭터가 필요합니다</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              던전을 탐험하기 위해서는 먼저 캐릭터를 생성해야 합니다.
            </p>
            <Button
              onClick={() => router.push("/character/create")}
              className="w-full"
            >
              <UserPlus className="mr-2 h-4 w-4" />새 캐릭터 만들기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 초기 로딩 UI
  if (loadingState.init) {
    return <DungeonLoading type="init" />;
  }

  // 던전 초기화 중 UI
  if (loadingState.dungeon) {
    return (
      <DungeonLoading
        type="dungeon"
        selectedCharacter={selectedCharacter || undefined}
      />
    );
  }

  // 던전 시작 전 화면
  if (!dungeonState) {
    return (
      <CharacterSelect
        selectedCharacter={selectedCharacter}
        showDialog={showCharacterSelect}
        onShowDialog={setShowCharacterSelect}
        characters={characters}
        onSelect={handleCharacterSelect}
        onCreateNew={() => router.push("/character/create")}
        isCharacterAvailable={isCharacterAvailable}
        getCharacterStatusText={getCharacterStatusText}
      />
    );
  }

  // 현재 활성화된 로그를 가져오는 함수
  const getCurrentLog = () => {
    return dungeonState?.logs[dungeonState.logs.length - 1];
  };

  const isItemLootedFromSpecificLog = (
    itemId: string,
    logId: string,
    dungeonState: DungeonState
  ): boolean => {
    return dungeonState.temporaryInventory?.some(
      (loot) =>
        loot.itemId.toString() === itemId && loot.logId.toString() === logId
    );
  };

  const isInCombat = (log: DungeonLog | undefined) => {
    if (!log || !log.data?.enemies) return false;

    // 모든 적의 현재 HP 합계가 0보다 큰지 확인
    const totalEnemyHp = log.data.enemies.reduce(
      (sum, enemy) => sum + enemy.hp,
      0
    );
    return totalEnemyHp > 0;
  };

  // 전투 시작 처리 함수
  const handleCombatStart = () => {
    if (!dungeonState || !selectedCharacter) return;

    const currentLog = getCurrentLog();
    if (!currentLog?.data?.enemies) return;

    // 선제 판정
    const initiativeRolls: Array<{
      name: string;
      roll: number;
      isPlayer: boolean;
      enemyIndex?: number;
    }> = [];

    // 플레이어 선제
    const playerDexMod = Math.floor(
      (selectedCharacter.stats.dexterity - 10) / 2
    );
    const playerRoll = Math.floor(Math.random() * 20) + 1 + playerDexMod;
    initiativeRolls.push({
      name: selectedCharacter.name,
      roll: playerRoll,
      isPlayer: true,
    });

    // 적 선제
    currentLog.data.enemies.forEach((enemy, index) => {
      const enemyRoll = Math.floor(Math.random() * 20) + 1;
      initiativeRolls.push({
        name: enemy.name,
        roll: enemyRoll,
        isPlayer: false,
        enemyIndex: index,
      });
    });

    // 선제 순서 정렬
    const sortedInitiative = initiativeRolls.sort((a, b) => b.roll - a.roll);
    const order = sortedInitiative.map(
      ({ name, isPlayer, enemyIndex, roll }) => ({
        name,
        isPlayer,
        enemyIndex,
        roll,
      })
    );

    setInitiativeOrder(order);
    setShowCombat(true);
  };

  const canLootRewards = (log: DungeonLog | undefined) => {
    if (!log) return false;

    // 적이 있는 경우, 모든 적이 처치되었는지 확인
    if (log.data?.enemies) {
      const totalEnemyHp = log.data.enemies.reduce(
        (sum, enemy) => sum + enemy.hp,
        0
      );
      if (totalEnemyHp > 0) return false;
    }

    // 보상이 있는지 확인
    return (
      log.data?.rewards &&
      ((log.data.rewards.gold > 0 && !log.data.rewards.goldLooted) ||
        log.data.rewards.items?.some(
          (item) =>
            !dungeonState?.temporaryInventory?.some(
              (loot) =>
                loot.itemId === item._id.toString() &&
                loot.logId === log._id.toString()
            )
        ))
    );
  };

  console.log("dungeonState", dungeonState);

  const currentLog = getCurrentLog();
  const rewards = currentLog?.data?.rewards;

  // 던전 탐험 진행 화면
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <DungeonHeader
            dungeonState={dungeonState}
            selectedCharacter={selectedCharacter!}
            onEscape={() => setShowEscapeConfirm(true)}
            onComplete={() => setShowCompleteConfirm(true)}
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 현재 상황 및 프롬프트 영역 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 현재 활성화된 로그 표시 */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-lg">현재 상황</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentLog && (
                    <div className="space-y-4">
                      {/* 기본 설명과 이미지는 항상 표시 */}
                      {!showCombat && (
                        <>
                          <p className="text-lg">{currentLog.description}</p>
                          {currentLog.image && (
                            <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
                              <img
                                src={currentLog.image}
                                alt="상황 이미지"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* 사망 상태 표시 */}
                      {CharacterDead.dead && (
                        <CharacterDeathCard
                          deathCause={CharacterDead.cause}
                          onConfirm={handleDungeonFail}
                        />
                      )}

                      {/* Trap 처리 - 해결되지 않은 트랩이 있을 때만 표시 */}
                      {currentLog.data?.trap &&
                        !currentLog.data.trap.resolved && (
                          <>
                            <TrapDiscoveryCard
                              onRollDice={() => setShowTrapDialog(true)}
                            />
                            <TrapDialog
                              open={showTrapDialog}
                              onOpenChange={setShowTrapDialog}
                              trap={currentLog.data.trap}
                              effects={
                                currentLog.effects || {
                                  hpChange: -Math.floor(
                                    selectedCharacter!.level * 1.5
                                  ), // 캐릭터 레벨 기반 기본 데미지
                                  stageProgress: false,
                                }
                              }
                              abilityModifier={getAbilityModifier(
                                selectedCharacter!,
                                currentLog.data.trap.type
                              )}
                              onResolutionComplete={handleTrapRollEnd}
                            />
                          </>
                        )}

                      {/* 트랩이 해결되었거나 없을 때만 전투/보상 표시 */}
                      {(!currentLog.data?.trap ||
                        currentLog.data.trap.resolved) && (
                        <>
                          {/* 전투 UI */}
                          {currentLog.data?.enemies &&
                            currentLog.data?.enemies?.length > 0 &&
                            !currentLog.data?.combat?.resolved &&
                            !CharacterDead.dead && (
                              <>
                                {!showCombat ? (
                                  <Card className="bg-red-500/10 border-red-500/50">
                                    <CardContent className="p-4 space-y-4">
                                      <div className="flex items-center gap-2 text-red-600">
                                        <SkullIcon className="w-5 h-5" />
                                        <h3 className="font-semibold">
                                          적대적 조우!
                                        </h3>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {currentLog.data.enemies.length}명의
                                        적이 등장했습니다:
                                        {currentLog.data.enemies
                                          .map(
                                            (e) => ` ${e.name} (Lv.${e.level})`
                                          )
                                          .join(",")}
                                      </p>
                                      <Button
                                        onClick={handleCombatStart}
                                        className="w-full"
                                      >
                                        <Swords className="w-4 h-4 mr-2" />
                                        전투 시작
                                      </Button>
                                    </CardContent>
                                  </Card>
                                ) : (
                                  <DungeonCombat
                                    enemies={currentLog.data.enemies}
                                    playerHp={dungeonState.playerHP}
                                    maxPlayerHp={selectedCharacter?.hp.max || 0}
                                    character={dungeonState.character}
                                    onCombatEnd={handleCombatEnd}
                                    dungeonName={dungeonState.dungeonName}
                                    dungeonConcept={dungeonState.concept}
                                    currentScene={currentLog.description}
                                    initiativeOrder={initiativeOrder}
                                  />
                                )}
                              </>
                            )}

                          {/* 전투/함정 결과 표시 */}
                          {(currentLog.data?.combat?.resolved ||
                            currentLog.data?.trap?.resolved) && (
                            <StatusResult
                              log={currentLog}
                              maxHp={selectedCharacter?.hp.max}
                            />
                          )}

                          {combatProcessing && (
                            <Card className="mt-4">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <p>전투 결과 처리 중...</p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* 보상 표시 */}
                          {currentLog &&
                            rewards &&
                            (rewards.gold > 0 || rewards.items?.length > 0) &&
                            (canLootRewards(currentLog) ? (
                              <DungeonRewards
                                rewards={rewards}
                                logId={currentLog._id.toString()}
                                temporaryInventory={
                                  dungeonState.temporaryInventory
                                }
                                onLootGold={handleLootGold}
                                onLootItem={handleLoot}
                              />
                            ) : isInCombat(currentLog) ? (
                              <Card className="bg-muted p-4">
                                <p className="text-center text-muted-foreground">
                                  전투를 완료한 후에 보상을 획득할 수 있습니다.
                                </p>
                              </Card>
                            ) : null)}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* 오른쪽 히스토리 패널 */}
            <div>
              {/* 행동 입력 카드 */}
              <DungeonActionInput
                value={userAction}
                onChange={(value) => setUserAction(value)}
                disabled={showCombat}
                isLoading={loadingState.action}
                onSubmit={handleActionSubmit}
              />
              {/* 활동 기록 카드 */}
              <DungeonLogs
                dungeonState={dungeonState}
                onLogClick={(log) => {
                  const dialogId = `log-dialog-${dungeonState.logs.indexOf(
                    log
                  )}`;
                  setShowLogDialog({ id: dialogId, log });
                }}
                onDeleteLog={(logIndex, description) => {
                  setShowDeleteConfirm({ logIndex, description });
                }}
              />
              <LootWarningDialog
                open={showLootWarning}
                onOpenChange={setShowLootWarning}
                onConfirm={() => {
                  setShowLootWarning(false);
                  handleActionSubmit();
                }}
              />
              <LogDetailDialog
                open={!!showLogDialog}
                onOpenChange={() => setShowLogDialog(null)}
                log={showLogDialog?.log || null}
                dungeonState={dungeonState!}
                onLootGold={handleLootGold}
                onLootItem={handleLoot}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 삭제 확인 다이얼로그 추가 */}
      <ConfirmDeleteDialog
        open={showDeleteConfirm !== null}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
        onConfirm={() => {
          if (showDeleteConfirm) {
            handleDeleteLog(showDeleteConfirm.logIndex);
          }
        }}
        description={showDeleteConfirm?.description || ""}
      />
      {/* 탈출 확인 다이얼로그 */}
      <EscapeConfirmDialog
        open={showEscapeConfirm}
        onOpenChange={setShowEscapeConfirm}
        onConfirm={handleEscape}
        inventoryCount={dungeonState?.temporaryInventory.length || 0}
      />
      {/* 탈출 결과 다이얼로그 */}
      <EscapeResultsDialog
        open={showEscapeResults}
        onOpenChange={setShowEscapeResults}
        results={escapeResults}
        onClose={() => {
          setShowEscapeResults(false);
          router.push("/worlds/town");
        }}
      />
      {/* 완료 다이얼로그 */}
      <CompleteConfirmDialog
        open={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        onConfirm={handleCompleteDungeon}
        inventoryCount={dungeonState?.temporaryInventory.length || 0}
      />
    </div>
  );
}
