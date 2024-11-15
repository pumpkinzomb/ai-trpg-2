import React from "react";
import { DungeonLog, DungeonState } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart, Check, X, Shield, Swords, Sword, Dice6 } from "lucide-react";
import { DungeonRewards } from "../DungeonRewards";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface LogDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: DungeonLog | null;
  dungeonState: DungeonState;
  onLootGold: (logId: string) => void;
  onLootItem: (itemId: string, logId: string) => void;
}

export function LogDetailDialog({
  open,
  onOpenChange,
  log,
  dungeonState,
  onLootGold,
  onLootItem,
}: LogDetailDialogProps) {
  if (!log) return null;

  const isInCombat = (log: DungeonLog) => {
    if (!log || !log.data?.enemies) return false;
    const totalEnemyHp = log.data.enemies.reduce(
      (sum, enemy) => sum + enemy.hp,
      0
    );
    return totalEnemyHp > 0;
  };

  const isCurrent =
    log._id === dungeonState.logs[dungeonState.logs.length - 1]._id;
  const isDisabled = isCurrent && isInCombat(log);

  const getCombatResult = () => {
    if (!log.data?.combat?.resolved || !log.data.combat.resolution) return null;
    const resolution = log.data.combat.resolution;

    return (
      <Alert
        className={resolution.victory ? "bg-green-500/10" : "bg-red-500/10"}
      >
        <div className="flex items-center gap-2">
          {resolution.victory ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          )}
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              {resolution.victory ? "전투 승리!" : "전투 패배"}
            </h4>
            <AlertDescription>
              {resolution.victory ? (
                <div className="space-y-1">
                  <p>획득 경험치: {resolution.experienceGained}</p>
                  {resolution.usedItems.length > 0 && (
                    <p>사용한 아이템: {resolution.usedItems.length}개</p>
                  )}
                </div>
              ) : (
                <p>다음 기회를 노려보세요...</p>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  const getTrapResult = () => {
    if (!log.data?.trap?.resolved || !log.data.trap.resolution) return null;
    const resolution = log.data.trap.resolution;

    return (
      <Alert
        className={resolution.success ? "bg-green-500/10" : "bg-red-500/10"}
      >
        <div className="flex items-center gap-4">
          {resolution.success ? (
            <Shield className="h-5 w-5 text-green-500" />
          ) : (
            <Swords className="h-5 w-5 text-red-500" />
          )}
          <div className="flex-1">
            <h4 className="font-medium mb-1">
              {resolution.success ? "함정 회피 성공!" : "함정 발동!"}
            </h4>
            <AlertDescription className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Dice6 className="h-4 w-4" />
                <span>주사위 굴림: {resolution.roll}</span>
              </div>
              {!resolution.success && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span>받은 피해: {resolution.damage}</span>
                </>
              )}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {log.type === "combat"
              ? "⚔️ 전투 기록"
              : log.type === "trap"
              ? "🎯 함정 기록"
              : "👣 활동 기록"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>{log.description}</p>

          {log.image && (
            <div className="aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden">
              <img
                src={log.image}
                alt="상황 이미지"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* 전투/함정 결과 표시 */}
          {log.type === "combat" && getCombatResult()}
          {log.type === "trap" && getTrapResult()}

          {/* 전투 참가자 정보 */}
          {log.type === "combat" && log.data?.enemies && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sword className="h-5 w-5" />
                <h4 className="font-semibold">전투 참가자</h4>
              </div>
              <div
                className={`space-y-4 ${
                  log.data.enemies.length > 1
                    ? "sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4"
                    : ""
                }`}
              >
                {log.data.enemies.map((enemy, index) => (
                  <div
                    key={index}
                    className="bg-muted rounded-lg overflow-hidden"
                  >
                    <div className="bg-background/50 p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-semibold">{enemy.name}</h5>
                          <Badge variant="outline" className="mt-1">
                            Level {enemy.level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 bg-background px-3 py-1 rounded-full">
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="font-medium">{enemy.hp}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      {enemy.attacks.map((attack, attackIndex) => (
                        <div
                          key={attackIndex}
                          className="text-sm bg-background p-2 rounded flex justify-between items-center"
                        >
                          <span className="font-medium">
                            {attack.name || `일반 공격 ${attackIndex + 1}`}
                          </span>
                          <Badge variant="destructive">{attack.damage}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 보상 정보 */}
          {log.data?.rewards && (
            <>
              {isDisabled ? (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    전투를 완료한 후에 보상을 획득할 수 있습니다.
                  </p>
                </div>
              ) : (
                <DungeonRewards
                  rewards={log.data.rewards}
                  logId={log._id.toString()}
                  temporaryInventory={dungeonState.temporaryInventory}
                  onLootGold={onLootGold}
                  onLootItem={onLootItem}
                  disabled={isDisabled}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
