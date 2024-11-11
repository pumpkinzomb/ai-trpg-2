"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Item, UsedItem } from "@/app/types";
import { Droplet } from "lucide-react";

const CombatInventory = ({
  items,
  onUseItem,
  disabled,
  usedItems,
}: {
  items: Item[];
  onUseItem: (itemId: string) => void;
  disabled: boolean;
  usedItems: UsedItem[];
}) => {
  const consumableItems = items.filter((item) => item.type === "consumable");
  const [open, setOpen] = useState(false);

  const getUsedCount = (itemId: string) => {
    return usedItems.filter((ui) => ui.itemId === itemId).length;
  };

  // 아직 사용되지 않은 아이템의 총 개수 계산
  const totalUnusedItems = consumableItems.reduce((acc, item) => {
    const usedCount = getUsedCount(item._id.toString());
    return usedCount === 0 ? acc + 1 : acc;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || totalUnusedItems === 0}
          className="flex items-center gap-2"
        >
          <Droplet className="w-4 h-4" />
          아이템 ({totalUnusedItems})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>전투 아이템 사용</DialogTitle>
          <DialogDescription>사용할 아이템을 선택하세요</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {consumableItems.map((item, index) => {
            const usedCount = getUsedCount(item._id.toString());
            const isUsed = usedCount > 0;

            return (
              <div
                key={`consumable-item-${index}`}
                className="flex flex-col gap-1"
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    onUseItem(item._id.toString());
                    setOpen(false);
                  }}
                  className="w-full justify-between"
                  disabled={isUsed}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    {isUsed ? (
                      <Badge variant="secondary" className="ml-2">
                        사용됨
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-green-100 text-green-800"
                      >
                        사용 가능
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item.stats.effects
                      .map((effect) => {
                        let effectText = "";
                        switch (effect.type) {
                          case "heal":
                            effectText = `체력 회복 ${effect.value}`;
                            break;
                          case "restore_resource":
                            effectText = `${effect.value} 자원 회복`;
                            break;
                          default:
                            effectText = `${effect.type} ${effect.value}`;
                        }
                        return effectText;
                      })
                      .join(", ")}
                  </span>
                </Button>
                <p className="text-xs text-muted-foreground px-2">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CombatInventory;
