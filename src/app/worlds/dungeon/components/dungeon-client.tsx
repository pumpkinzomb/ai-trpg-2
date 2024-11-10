"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Character, DungeonState, DungeonLog, Item } from "@/app/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import DungeonCombat from "./DungeonCombat";
import { useToast } from "@/hooks/use-toast";
import {
  Skull,
  Boxes,
  ArrowRight,
  DoorOpen,
  Loader2,
  Plus,
  UserPlus,
  Heart,
  History,
  Crown,
  Trash2,
} from "lucide-react";

type LoadingState = {
  init: boolean; // 초기 캐릭터 로딩
  dungeon: boolean; // 던전 초기화
  action: boolean; // 액션 처리
};

export function DungeonClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
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
  const [showLogDialog, setShowLogDialog] = useState<{
    id: string;
    log: DungeonLog;
  } | null>(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      if (!response.ok) throw new Error("Failed to fetch characters");
      const data = await response.json();
      setCharacters(data.characters);
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
        setDungeonState({ ...activeData.dungeon, temporaryInventory: [] });
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
      setDungeonState({ ...data.dungeon, temporaryInventory: [] });
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

  const handleEscape = async () => {
    if (!selectedCharacter || !dungeonState) return;

    try {
      const response = await fetch("/api/dungeon/escape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter._id.toString(),
          dungeonState,
        }),
      });

      if (!response.ok) throw new Error("Failed to escape");
      const data = await response.json();

      if (data.rewards) {
        await updateCharacterRewards(data.rewards);
      }

      toast({
        title: "탈출 성공",
        description: "던전에서 무사히 탈출했습니다.",
      });

      router.push("/worlds/town");
    } catch (error) {
      console.error("Failed to escape:", error);
      toast({
        variant: "destructive",
        title: "탈출 실패",
        description: "던전을 탈출하는데 실패했습니다.",
      });
    }
  };

  const updateCharacterRewards = async (rewards: any) => {
    if (!selectedCharacter) return;

    try {
      await fetch("/api/character/update-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacter._id,
          rewards,
        }),
      });
    } catch (error) {
      console.error("Failed to update character rewards:", error);
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
      setDungeonState({ ...dungeonState, logs: updatedDungeon.logs });

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
      const response = await fetch("/api/dungeon/delete-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dungeonId: dungeonState._id.toString(),
          logIndex,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete log");
      }

      const updatedDungeon = await response.json();
      setDungeonState(updatedDungeon);
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
    return (
      <div className="container mx-auto py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">캐릭터 목록 불러오는 중...</p>
      </div>
    );
  }

  // 던전 초기화 중 UI
  if (loadingState.dungeon) {
    return (
      <div className="container mx-auto py-20">
        <Card>
          <CardHeader>
            <CardTitle>던전 생성 중</CardTitle>
            <CardDescription>
              던전을 생성하고 있습니다. 잠시만 기다려주세요...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            {selectedCharacter && (
              <Card className="bg-muted w-full max-w-md">
                <CardContent className="flex items-center p-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={selectedCharacter.profileImage}
                      alt={selectedCharacter.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedCharacter.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lv.{selectedCharacter.level} {selectedCharacter.race}{" "}
                      {selectedCharacter.class}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // 던전 시작 전 화면
  if (!dungeonState) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>던전 탐험</CardTitle>
            <CardDescription>
              위험한 던전에서 보물과 영광을 손에 넣으세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedCharacter ? (
              <div className="space-y-4">
                <Card className="bg-muted">
                  <CardContent className="flex items-center p-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                      <img
                        src={selectedCharacter.profileImage}
                        alt={selectedCharacter.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {selectedCharacter.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Lv.{selectedCharacter.level} {selectedCharacter.race}{" "}
                        {selectedCharacter.class}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Button
                  variant="outline"
                  onClick={() => setShowCharacterSelect(true)}
                  className="w-full"
                >
                  다른 캐릭터 선택
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowCharacterSelect(true)}
                className="w-full"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                캐릭터 선택하기
              </Button>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={showCharacterSelect}
          onOpenChange={setShowCharacterSelect}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>던전 탐험에 참여할 캐릭터를 선택하세요</DialogTitle>
              <DialogDescription>
                선택한 캐릭터로 던전을 탐험하게 됩니다. 신중하게 선택하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {characters.map((character) => (
                <Card
                  key={character._id.toString()}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleCharacterSelect(character)}
                >
                  <CardContent className="flex items-center p-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                      <img
                        src={character.profileImage}
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{character.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Lv.{character.level} {character.race} {character.class}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                onClick={() => router.push("/character/create")}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />새 캐릭터 만들기
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 던전 실패 상태
  if (dungeonState?.playerHP <= 0) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500 flex items-center gap-2">
              <Skull className="h-6 w-6" />
              던전 탐험 실패
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              당신은 의식을 잃었습니다... 마을로 돌아가 회복이 필요합니다.
            </p>
            <Button
              onClick={() => router.push("/worlds/town")}
              className="w-full"
              variant="destructive"
            >
              <DoorOpen className="mr-2 h-4 w-4" />
              마을로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  // 현재 활성화된 로그를 가져오는 함수
  const getCurrentLog = () => {
    return dungeonState?.logs[dungeonState.logs.length - 1];
  };

  const isItemLootedFromLog = (log: DungeonLog, dungeonState: DungeonState) => {
    if (!log.data?.rewards?.items?.length) return false;
    return log.data.rewards.items.some((item) =>
      dungeonState.temporaryInventory?.some(
        (loot) =>
          item._id.toString() === loot.itemId &&
          log._id.toString() === loot.logId
      )
    );
  };

  const isItemLootedFromSpecificLog = (
    itemId: string,
    logId: string,
    dungeonState: DungeonState
  ): boolean => {
    return dungeonState.temporaryInventory?.some(
      (loot) => loot.itemId === itemId && loot.logId === logId
    );
  };

  const currentLog = getCurrentLog();
  const rewards = currentLog?.data?.rewards;

  // 던전 탐험 진행 화면
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-col space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1 mr-4">
              <CardTitle className="text-2xl">
                {dungeonState.dungeonName} - {dungeonState.currentStage + 1}/
                {dungeonState.maxStages} 스테이지
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {dungeonState.concept}
              </CardDescription>
            </div>
            {dungeonState.canEscape && (
              <Button
                variant="outline"
                onClick={() => setShowEscapeConfirm(true)}
                className="shrink-0"
              >
                <DoorOpen className="w-4 h-4 mr-2" />
                탈출하기
              </Button>
            )}
          </div>

          {/* 캐릭터 상태 표시 */}
          <Card className="bg-muted">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src={selectedCharacter?.profileImage}
                    alt={selectedCharacter?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedCharacter?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lv.{selectedCharacter?.level} {selectedCharacter?.race}{" "}
                    {selectedCharacter?.class}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-semibold">
                    {dungeonState.playerHP} HP
                  </span>
                </div>
                {dungeonState.temporaryInventory?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">
                      {dungeonState.temporaryInventory.length}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
                      <p className="text-lg">{currentLog.description}</p>

                      {/* 이미지가 있는 경우 표시 */}
                      {currentLog.image && (
                        <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
                          <img
                            src={currentLog.image}
                            alt="상황 이미지"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* 전투 상태 */}
                      {currentLog.type === "combat" &&
                        currentLog.data?.enemies && (
                          <DungeonCombat
                            enemies={currentLog.data.enemies}
                            playerHp={dungeonState.playerHP}
                            character={selectedCharacter!}
                            onCombatEnd={(result) => {}}
                          />
                        )}

                      {/* 보상 표시 - gold나 items가 있을 때만 표시 */}
                      {rewards &&
                        (rewards.gold > 0 || rewards.items?.length > 0) && (
                          <div className="mt-4 bg-accent/50 p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">
                              획득 가능한 보상
                            </h4>
                            {rewards.gold > 0 && (
                              <div className="flex items-center justify-between bg-background p-2 rounded mb-2">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-yellow-500" />
                                  <span>{rewards.gold} Gold</span>
                                </div>
                                {!rewards.goldLooted && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleLootGold(currentLog._id.toString())
                                    }
                                  >
                                    획득
                                  </Button>
                                )}
                                {rewards.goldLooted && (
                                  <span className="text-sm text-muted-foreground italic">
                                    획득 완료
                                  </span>
                                )}
                              </div>
                            )}
                            {rewards.items && rewards.items.length > 0 && (
                              <div className="space-y-2">
                                {rewards.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-background p-2 rounded"
                                  >
                                    <span>{item.name}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleLoot(
                                          item._id.toString(),
                                          currentLog._id.toString()
                                        )
                                      }
                                    >
                                      획득
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 오른쪽 히스토리 패널 */}
            <div>
              {/* 행동 입력 카드 */}
              <Card className="mb-6">
                <CardContent className="space-y-4 p-4">
                  <textarea
                    value={userAction}
                    onChange={(e) => setUserAction(e.target.value)}
                    className="w-full p-4 rounded-lg border min-h-[100px] bg-background"
                    placeholder="행동을 입력하세요..."
                    disabled={loadingState.action}
                  />
                  <Button
                    onClick={handleActionSubmit}
                    disabled={loadingState.action || !userAction.trim()}
                    className="w-full"
                  >
                    {loadingState.action ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        진행 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        행동하기
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* 활동 기록 카드 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    활동 기록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {dungeonState.logs
                      .slice()
                      .reverse()
                      .map((log, index) => {
                        const originalIndex =
                          dungeonState.logs.length - 1 - index;
                        return (
                          <div
                            key={index}
                            className="mb-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative group"
                            onClick={() => {
                              const dialogId = `log-dialog-${index}`;
                              setShowLogDialog({ id: dialogId, log });
                            }}
                          >
                            <p className="text-sm pr-8">
                              {log.type === "combat" ? "⚔️ " : "👣 "}
                              {log.description.length > 100
                                ? `${log.description.substring(0, 100)}...`
                                : log.description}
                            </p>
                            {log.data?.rewards &&
                              (log.data.rewards.gold >= 0 ||
                                log.data.rewards.items?.length > 0) && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  {log.data.rewards.gold > 0 && (
                                    <span className="mr-2">
                                      {log.data.rewards.goldLooted ? "✓ " : ""}
                                      💰 {log.data.rewards.gold} Gold
                                    </span>
                                  )}
                                  {log.data.rewards.items?.length > 0 && (
                                    <span>
                                      {isItemLootedFromLog(log, dungeonState)
                                        ? "✓ "
                                        : ""}
                                      📦 {log.data.rewards.items.length} items
                                    </span>
                                  )}
                                </div>
                              )}

                            {/* 삭제 버튼 - 첫 번째 로그가 아닌 경우에만 표시 */}
                            {originalIndex !== 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm({
                                    logIndex: originalIndex,
                                    description: log.description,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* 로그 상세 보기 다이얼로그 */}
              <Dialog
                open={!!showLogDialog}
                onOpenChange={() => setShowLogDialog(null)}
              >
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {showLogDialog?.log.type === "combat"
                        ? "⚔️ 전투 기록"
                        : "👣 활동 기록"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* 로그 설명 */}
                    <p>{showLogDialog?.log.description}</p>

                    {/* 이미지가 있는 경우 */}
                    {showLogDialog?.log.image && (
                      <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
                        <img
                          src={showLogDialog.log.image}
                          alt="상황 이미지"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* 전투 정보 */}
                    {showLogDialog?.log.type === "combat" &&
                      showLogDialog.log.data?.enemies && (
                        <div className="space-y-4">
                          <h4 className="font-semibold">전투 참가자</h4>
                          {showLogDialog.log.data.enemies.map(
                            (enemy, index) => (
                              <div
                                key={index}
                                className="bg-muted p-4 rounded-lg"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <div>
                                    <h5 className="font-semibold">
                                      {enemy.name}
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                      Lv.{enemy.level}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-red-500" />
                                    <span>{enemy.hp}</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  {enemy.attacks.map((attack, attackIndex) => (
                                    <div
                                      key={attackIndex}
                                      className="text-sm bg-background p-2 rounded flex justify-between"
                                    >
                                      <span>{attack.name}</span>
                                      <span className="text-red-500">
                                        {attack.damage}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                    {/* 보상 정보 */}
                    {showLogDialog?.log.data?.rewards &&
                      (showLogDialog.log.data.rewards.gold > 0 ||
                        showLogDialog.log.data.rewards.items?.length > 0) && (
                        <div className="bg-accent/50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-2">보상</h4>
                          {showLogDialog.log.data.rewards.gold > 0 && (
                            <div className="flex items-center justify-between bg-background p-2 rounded mb-2">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                <span>
                                  {showLogDialog.log.data.rewards.gold} Gold
                                </span>
                              </div>
                              {!showLogDialog.log.data.rewards.goldLooted ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    handleLootGold(
                                      showLogDialog.log._id.toString()
                                    )
                                  }
                                >
                                  획득
                                </Button>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  획득 완료
                                </span>
                              )}
                            </div>
                          )}
                          {showLogDialog.log.data.rewards.items?.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-background p-2 rounded mb-2"
                              >
                                <span>{item.name}</span>
                                {/* 아이템이 아직 획득되지 않은 경우에만 획득 버튼 표시 */}
                                {!isItemLootedFromSpecificLog(
                                  item._id.toString(),
                                  showLogDialog.log._id.toString(),
                                  dungeonState
                                ) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleLoot(
                                        item._id.toString(),
                                        showLogDialog.log._id.toString()
                                      )
                                    }
                                  >
                                    획득
                                  </Button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 다이얼로그 추가 */}
      <Dialog
        open={showDeleteConfirm !== null}
        onOpenChange={(open) => !open && setShowDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>로그 삭제 확인</DialogTitle>
            <DialogDescription>
              다음 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              {showDeleteConfirm?.description && (
                <p className="mt-2 p-2 bg-muted rounded-md">
                  "
                  {showDeleteConfirm.description.length > 100
                    ? `${showDeleteConfirm.description.substring(0, 100)}...`
                    : showDeleteConfirm.description}
                  "
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (showDeleteConfirm) {
                  handleDeleteLog(showDeleteConfirm.logIndex);
                }
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 탈출 확인 다이얼로그 */}
      <Dialog open={showEscapeConfirm} onOpenChange={setShowEscapeConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>던전을 탈출하시겠습니까?</DialogTitle>
            <DialogDescription>
              지금까지 획득한 보상은 유지되지만, 더 이상의 탐험은 불가능합니다.
              {dungeonState.temporaryInventory.length > 0 && (
                <p className="mt-2">
                  획득한 아이템 {dungeonState.temporaryInventory.length}개를
                  가지고 탈출합니다.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEscapeConfirm(false)}
            >
              취소
            </Button>
            <Button onClick={handleEscape}>탈출하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
