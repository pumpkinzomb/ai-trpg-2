import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  Skull,
  Flag,
  Loader2,
  Swords,
  Target,
  Coins,
  Package,
  BookOpen,
  Bed,
  Scroll,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DungeonLog } from "@/app/types";

interface DungeonLogResponse {
  logs: DungeonLog[];
  status: "active" | "completed" | "failed";
  rewards?: {
    xp: number;
    gold: number;
  };
}

interface DungeonLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dungeonId: string | null;
  initialData: {
    characterName: string;
    dungeonName: string;
    currentStage: number;
    maxStages: number;
    status: "completed" | "failed";
    rewards?: {
      xp: number;
      gold: number;
    };
  } | null;
}

const LogTypeIcon = {
  combat: Swords,
  trap: Target,
  treasure: Coins,
  story: BookOpen,
  rest: Bed,
} as const;

const getLogStyle = (type: DungeonLog["type"]) => {
  switch (type) {
    case "combat":
      return { bg: "bg-red-500/10 hover:bg-red-500/20", text: "text-red-500" };
    case "trap":
      return {
        bg: "bg-yellow-500/10 hover:bg-yellow-500/20",
        text: "text-yellow-500",
      };
    case "treasure":
      return {
        bg: "bg-amber-500/10 hover:bg-amber-500/20",
        text: "text-amber-500",
      };
    case "story":
      return {
        bg: "bg-blue-500/10 hover:bg-blue-500/20",
        text: "text-blue-500",
      };
    case "rest":
      return {
        bg: "bg-green-500/10 hover:bg-green-500/20",
        text: "text-green-500",
      };
  }
};

export function DungeonLogDialog({
  open,
  onOpenChange,
  dungeonId,
  initialData,
}: DungeonLogDialogProps) {
  const [loading, setLoading] = useState(false);
  const [dungeonData, setDungeonData] = useState<DungeonLogResponse | null>(
    null
  );

  useEffect(() => {
    async function fetchDungeonLogs() {
      if (!dungeonId) return;

      setLoading(true);
      try {
        const response = await fetch(`/api/dungeon/${dungeonId}/logs`);
        if (response.ok) {
          const data = await response.json();
          setDungeonData(data);
        }
      } catch (error) {
        console.error("Failed to fetch dungeon logs:", error);
      } finally {
        setLoading(false);
      }
    }

    if (open && dungeonId) {
      fetchDungeonLogs();
    }
  }, [open, dungeonId]);

  if (!open || !initialData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl">
            {initialData.characterName}의 {initialData.dungeonName}
          </DialogTitle>

          {/* 상태 및 진행도 정보 */}
          <div className="flex flex-col gap-3">
            {/* 클리어 상태 */}
            <Badge
              className="w-fit text-base py-2"
              variant={
                initialData.status === "completed" ? "default" : "destructive"
              }
            >
              {initialData.status === "completed" ? (
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  <span>클리어 성공</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5" />
                  <span>클리어 실패</span>
                </div>
              )}
            </Badge>

            {/* 스테이지 진행도 */}
            <Badge variant="outline" className="w-fit text-base py-2">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5" />
                <span>
                  스테이지 {initialData.currentStage + 1} /{" "}
                  {initialData.maxStages}
                </span>
              </div>
            </Badge>
          </div>
        </DialogHeader>

        {/* 보상 정보 */}
        {dungeonData?.rewards && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <h4 className="text-lg font-medium">획득한 보상</h4>
            </div>
            <div className="flex gap-6 text-base">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-purple-500" />
                <span>경험치: {dungeonData.rewards.xp.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span>골드: {dungeonData.rewards.gold.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}

        {/* 로그 목록 */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : dungeonData?.logs ? (
            <div className="space-y-4">
              {dungeonData.logs.map((log, index) => {
                const LogIcon = LogTypeIcon[log.type];
                const style = getLogStyle(log.type);
                return (
                  <Card
                    key={index}
                    className={cn("p-4", style.bg, "transition-colors")}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2 rounded-lg", style.bg)}>
                        <LogIcon className={cn("w-6 h-6", style.text)} />
                      </div>
                      <div className="flex-1">
                        <p className="text-base mb-2">{log.description}</p>
                        {log.data?.rewards && (
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            {log.data.rewards.gold > 0 &&
                              !log.data.rewards.goldLooted && (
                                <div className="flex items-center gap-2">
                                  <Coins className="w-4 h-4" />
                                  <span>
                                    {log.data.rewards.gold.toLocaleString()}{" "}
                                    골드
                                  </span>
                                </div>
                              )}
                            {log.data.rewards.xp > 0 && (
                              <div className="flex items-center gap-2">
                                <Scroll className="w-4 h-4" />
                                <span>
                                  {log.data.rewards.xp.toLocaleString()} 경험치
                                </span>
                              </div>
                            )}
                            {log.data.rewards.items?.length > 0 && (
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                <span>
                                  아이템 {log.data.rewards.items.length}개
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {log.image && (
                        <img
                          src={log.image}
                          alt="로그 이미지"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              로그를 불러올 수 없습니다.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
