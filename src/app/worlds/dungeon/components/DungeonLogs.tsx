import { DungeonState, DungeonLog } from "@/app/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Package, Crown, Check, Trash2, Lock } from "lucide-react";

interface DungeonLogsProps {
  dungeonState: DungeonState;
  onLogClick: (log: DungeonLog) => void;
  onDeleteLog: (logIndex: number, description: string) => void;
}

export function DungeonLogs({
  dungeonState,
  onLogClick,
  onDeleteLog,
}: DungeonLogsProps) {
  const isItemLootedFromSpecificLog = (itemId: string, logId: string) => {
    return dungeonState.temporaryInventory?.some(
      (loot) =>
        loot.itemId.toString() === itemId && loot.logId.toString() === logId
    );
  };

  const isInCombat = (log: DungeonLog) => {
    if (!log || !log.data?.enemies) return false;
    const totalEnemyHp = log.data.enemies.reduce(
      (sum, enemy) => sum + enemy.hp,
      0
    );
    return totalEnemyHp > 0;
  };

  const getLogIcon = (log: DungeonLog) => {
    switch (log.type) {
      case "combat":
        return "⚔️ ";
      case "trap":
        return "🎯 ";
      default:
        return "👣 ";
    }
  };

  const getCombatResultDisplay = (log: DungeonLog) => {
    if (!log.data?.combat?.resolved || !log.data.combat.resolution) return null;
    const resolution = log.data.combat.resolution;

    return (
      <div className="mt-1 text-xs">
        {resolution?.victory ? (
          <span className="text-green-500 flex items-center gap-1">
            <Check className="h-3 w-3" />
            전투 승리 (획득 경험치: {resolution.experienceGained})
          </span>
        ) : (
          <span className="text-red-500">전투 패배</span>
        )}
        {resolution?.usedItems.length > 0 && (
          <span className="text-muted-foreground ml-2">
            · 사용한 아이템: {resolution.usedItems.length}개
          </span>
        )}
      </div>
    );
  };

  const getTrapResultDisplay = (log: DungeonLog) => {
    if (!log.data?.trap?.resolved || !log.data.trap.resolution) return null;
    const resolution = log.data.trap.resolution;

    return (
      <div className="mt-1 text-xs">
        {resolution?.success ? (
          <span className="text-green-500 flex items-center gap-1">
            <Check className="h-3 w-3" />
            함정 회피 성공 (굴림: {resolution.roll})
          </span>
        ) : (
          <span className="text-red-500 flex items-center gap-1">
            <span>❌</span>
            함정 판정 실패 (굴림: {resolution.roll}) - 피해: {resolution.damage}
          </span>
        )}
      </div>
    );
  };

  return (
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
              const originalIndex = dungeonState.logs.length - 1 - index;
              const isCurrent = originalIndex === dungeonState.logs.length - 1;
              const inCombat = isCurrent && isInCombat(log);

              return (
                <div
                  key={index}
                  className="mb-4 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors relative group"
                  onClick={() => onLogClick(log)}
                >
                  <p className="text-sm pr-8">
                    {getLogIcon(log)}
                    {log.description.length > 100
                      ? `${log.description.substring(0, 100)}...`
                      : log.description}
                  </p>

                  {/* 전투/함정 결과 표시 */}
                  {getCombatResultDisplay(log)}
                  {getTrapResultDisplay(log)}
                  {/* 보상 표시 */}
                  {log.data?.rewards && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center space-x-4">
                      {(log.data.rewards.gold > 0 ||
                        log.data.rewards.goldLooted) && (
                        <div className="flex items-center gap-2">
                          <Crown className="h-3 w-3 text-yellow-500" />
                          {log.data.rewards.goldLooted ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              골드 획득 완료
                            </span>
                          ) : inCombat ? (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              전투 후 획득 가능
                            </span>
                          ) : (
                            `${log.data.rewards.gold} Gold`
                          )}
                        </div>
                      )}
                      {log.data.rewards.items?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-blue-500" />
                          {log.data.rewards.items.every((item) =>
                            isItemLootedFromSpecificLog(
                              item._id.toString(),
                              log._id.toString()
                            )
                          ) ? (
                            <span className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              아이템 획득 완료
                            </span>
                          ) : inCombat ? (
                            <span className="flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              전투 후 획득 가능
                            </span>
                          ) : (
                            `${log.data.rewards.items.length}개의 아이템`
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {originalIndex !== 0 &&
                    originalIndex === dungeonState.logs.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLog(originalIndex, log.description);
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
  );
}
