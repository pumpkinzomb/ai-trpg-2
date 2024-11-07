import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Backpack,
  Coins,
  Search,
  SlidersHorizontal,
  ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Item } from "@/app/types";

interface Props {
  inventory: Item[];
  gold: number;
  onEquip: (item: Item) => void;
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

export default function CharacterInventory({
  inventory,
  gold,
  onEquip,
  characterLevel,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "value" | "level" | "rarity">(
    "name"
  );

  const filteredInventory = inventory
    .filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesFilter = filter === "all" || item.type === filter;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sort) {
        case "value":
          return b.value - a.value;
        case "level":
          return b.requiredLevel - a.requiredLevel;
        case "rarity": {
          const rarityOrder = [
            "legendary",
            "epic",
            "rare",
            "uncommon",
            "common",
          ];
          return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const renderItemStats = (item: Item) => (
    <div className="space-y-1 text-sm">
      {item.stats.damage && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>Damage: {item.stats.damage}</span>
        </div>
      )}
      {item.stats.defense && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>Defense: {item.stats.defense}</span>
        </div>
      )}
      {item.stats.effects.map((effect, index) => (
        <div key={index} className="text-muted-foreground">
          {effect.type}: {effect.value}
        </div>
      ))}
    </div>
  );

  const ItemCard = ({ item }: { item: Item }) => (
    <div
      className={cn(
        "p-3 border rounded-lg",
        rarityConfig[item.rarity].border,
        rarityConfig[item.rarity].darkBorder
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn("font-medium", rarityConfig[item.rarity].color)}
            >
              {item.name}
            </span>
            <Badge variant="outline" className="capitalize">
              {item.type}
            </Badge>
          </div>
          {renderItemStats(item)}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Coins className="w-4 h-4" />
            <span>{item.value} GP</span>
            {item.requiredLevel > characterLevel && (
              <Badge variant="destructive" className="ml-auto">
                Req. Level {item.requiredLevel}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant={
              item.requiredLevel > characterLevel ? "outline" : "default"
            }
            onClick={() => onEquip(item)}
            disabled={item.requiredLevel > characterLevel}
          >
            장착
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Backpack className="w-5 h-5" />
            Inventory
          </CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            <Coins className="w-4 h-4" />
            {gold} GP
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" value={filter} onValueChange={setFilter}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="weapon" className="flex-1">
              Weapons
            </TabsTrigger>
            <TabsTrigger value="armor" className="flex-1">
              Armor
            </TabsTrigger>
            <TabsTrigger value="accessory" className="flex-1">
              Accessories
            </TabsTrigger>
          </TabsList>

          <div className="mt-2 flex items-center justify-end gap-2">
            <select
              className="text-sm bg-transparent"
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              <option value="name">Name</option>
              <option value="value">Value</option>
              <option value="level">Level</option>
              <option value="rarity">Rarity</option>
            </select>
          </div>

          <TabsContent value={filter} className="mt-2">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <ItemCard key={item._id.toString()} item={item} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ShieldQuestion className="w-8 h-8 mb-2" />
                    <p>No items found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
