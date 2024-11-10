import { DungeonLog, DungeonState } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heart } from "lucide-react";
import { DungeonRewards } from "../DungeonRewards";

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

  // 현재 로그인지 확인
  const isCurrent =
    log._id === dungeonState.logs[dungeonState.logs.length - 1]._id;
  // 현재 로그이고 전투 중인 경우 보상 획득 불가
  const isDisabled = isCurrent && isInCombat(log);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {log.type === "combat" ? "⚔️ 전투 기록" : "👣 활동 기록"}
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

          {log.type === "combat" && log.data?.enemies && (
            <div className="space-y-4">
              <h4 className="font-semibold">전투 참가자</h4>
              {log.data.enemies.map((enemy, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h5 className="font-semibold">{enemy.name}</h5>
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
                        <span className="text-red-500">{attack.damage}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  dungeonState={dungeonState}
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
