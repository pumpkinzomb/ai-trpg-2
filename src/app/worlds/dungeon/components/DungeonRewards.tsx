import { DungeonState, DungeonLog } from "@/app/types";
import { Crown, Package, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DungeonRewardsProps {
  rewards: NonNullable<DungeonLog["data"]>["rewards"];
  logId: string;
  dungeonState: DungeonState;
  onLootGold: (logId: string) => void;
  onLootItem: (itemId: string, logId: string) => void;
  disabled?: boolean;
}

export function DungeonRewards({
  rewards,
  logId,
  dungeonState,
  onLootGold,
  onLootItem,
  disabled = false,
}: DungeonRewardsProps) {
  const isItemLootedFromSpecificLog = (itemId: string, logId: string) => {
    return dungeonState.temporaryInventory?.some(
      (loot) =>
        loot.itemId.toString() === itemId && loot.logId.toString() === logId
    );
  };

  if (!rewards || (!rewards.gold && !rewards.items?.length)) {
    return null;
  }

  return (
    <div className="mt-4 bg-accent/50 p-4 rounded-lg">
      <h4 className="font-semibold mb-2">획득 가능한 보상</h4>
      {(rewards.gold > 0 || rewards.goldLooted) && (
        <div className="flex items-center justify-between bg-background p-2 rounded mb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>
              {rewards.goldLooted ? (
                <span className="text-muted-foreground">
                  <Check className="h-4 w-4 inline mr-1" />
                  골드 획득 완료
                </span>
              ) : (
                `${rewards.gold} Gold`
              )}
            </span>
          </div>
          {!rewards.goldLooted && !disabled && (
            <Button size="sm" variant="ghost" onClick={() => onLootGold(logId)}>
              획득
            </Button>
          )}
        </div>
      )}
      {rewards.items?.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between bg-background p-2 rounded mb-2"
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-500" />
            {isItemLootedFromSpecificLog(item._id.toString(), logId) ? (
              <span className="text-muted-foreground flex items-center">
                <Check className="h-4 w-4 inline mr-1" />
                {item.name} 획득 완료
              </span>
            ) : (
              <span>{item.name}</span>
            )}
          </div>
          {!isItemLootedFromSpecificLog(item._id.toString(), logId) &&
            !disabled && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLootItem(item._id.toString(), logId)}
              >
                획득
              </Button>
            )}
        </div>
      ))}
    </div>
  );
}
