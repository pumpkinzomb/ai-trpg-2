import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sword,
  Shield,
  Shirt,
  Crown,
  GripHorizontal,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Item } from "@/app/types";

interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  shield: Item | null;
  accessories: Item[];
}

interface Props {
  equipment: Equipment;
  inventory: Item[];
  onEquip: (item: Item) => void;
  onUnequip: (slot: string, index?: number) => void;
  characterLevel: number;
}

const rarityConfig = {
  common: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    darkBg: "dark:bg-slate-800",
    darkBorder: "dark:border-slate-700",
  },
  uncommon: {
    color: "text-green-500",
    bg: "bg-green-100",
    border: "border-green-200",
    darkBg: "dark:bg-green-900/30",
    darkBorder: "dark:border-green-800",
  },
  rare: {
    color: "text-blue-500",
    bg: "bg-blue-100",
    border: "border-blue-200",
    darkBg: "dark:bg-blue-900/30",
    darkBorder: "dark:border-blue-800",
  },
  epic: {
    color: "text-purple-500",
    bg: "bg-purple-100",
    border: "border-purple-200",
    darkBg: "dark:bg-purple-900/30",
    darkBorder: "dark:border-purple-800",
  },
  legendary: {
    color: "text-orange-500",
    bg: "bg-orange-100",
    border: "border-orange-200",
    darkBg: "dark:bg-orange-900/30",
    darkBorder: "dark:border-orange-800",
  },
};

export default function CharacterEquipment({
  equipment,
  inventory,
  onEquip,
  onUnequip,
  characterLevel,
}: Props) {
  const getEquippableItems = (slot: string) => {
    return inventory.filter((item) => {
      if (slot === "accessory") return item.type === "accessory";
      return item.type === slot;
    });
  };

  const renderItemStats = (item: Item) => (
    <div className="space-y-1 text-sm">
      {item.stats.damage && (
        <div className="flex items-center gap-2">
          <Sword className="w-4 h-4" />
          <span>Damage: {item.stats.damage}</span>
        </div>
      )}
      {item.stats.defense && (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Defense: {item.stats.defense}</span>
        </div>
      )}
      {item.stats.effects.map((effect, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-muted-foreground"
        >
          <Crown className="w-4 h-4" />
          <span>
            {effect.type}: {effect.value}
          </span>
        </div>
      ))}
    </div>
  );

  const EquipmentSlot = ({
    item,
    slot,
    icon: Icon,
  }: {
    item: Item | null;
    slot: string;
    icon: React.ElementType;
  }) => {
    const equippableItems = getEquippableItems(slot);

    return (
      <div
        className={cn(
          "relative p-4 border rounded-lg",
          item ? rarityConfig[item.rarity].border : "border-dashed",
          item ? rarityConfig[item.rarity].darkBorder : ""
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            <span className="font-medium capitalize">{slot}</span>
          </div>
          {item && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onUnequip(slot)}
            >
              <GripHorizontal className="w-4 h-4" />
            </Button>
          )}
        </div>

        {item ? (
          <div className="space-y-2">
            <div className={cn("font-medium", rarityConfig[item.rarity].color)}>
              {item.name}
              {item.requiredLevel > characterLevel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertCircle className="w-4 h-4 inline ml-2 text-red-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Requires level {item.requiredLevel}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {renderItemStats(item)}
          </div>
        ) : (
          <div className="space-y-2">
            {equippableItems.length > 0 ? (
              equippableItems.map((item) => (
                <Button
                  key={item._id.toString()}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start",
                    rarityConfig[item.rarity].color,
                    item.requiredLevel > characterLevel ? "opacity-50" : ""
                  )}
                  onClick={() => onEquip(item)}
                  disabled={item.requiredLevel > characterLevel}
                >
                  {item.name}
                </Button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                No items available
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // 액세서리 슬롯 컴포넌트
  const AccessorySlot = ({ index }: { index: number }) => {
    const item = equipment.accessories[index];
    const accessoryItems = getEquippableItems("accessory");

    return (
      <div
        className={cn(
          "p-2 border rounded-lg",
          item ? rarityConfig[item.rarity].border : "border-dashed",
          item ? rarityConfig[item.rarity].darkBorder : ""
        )}
      >
        {item ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "text-sm font-medium",
                  rarityConfig[item.rarity].color
                )}
              >
                {item.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onUnequip("accessory", index)}
              >
                <GripHorizontal className="w-3 h-3" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              {item.stats.effects.map((effect, idx) => (
                <div key={idx}>
                  {effect.type}: {effect.value}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-1">
            {accessoryItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => onEquip(accessoryItems[0])}
              >
                + Add
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sword className="w-5 h-5" />
          Equipment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <EquipmentSlot item={equipment.weapon} slot="weapon" icon={Sword} />
        <EquipmentSlot item={equipment.armor} slot="armor" icon={Shirt} />
        <EquipmentSlot item={equipment.shield} slot="shield" icon={Shield} />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Accessories</h4>
            <Badge variant="outline">{equipment.accessories.length}/4</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, i) => (
              <AccessorySlot key={i} index={i} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
