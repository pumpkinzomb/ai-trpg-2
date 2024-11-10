"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Coins,
  Shield,
  Sword,
  Star,
  Sparkles,
  Store,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Character, Item } from "@/app/types";

type MarketType = "normal" | "secret" | "black";

interface MarketInfo {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const MARKET_INFO: Record<MarketType, MarketInfo> = {
  normal: {
    title: "마을 시장",
    description: "평화로운 마을의 일반적인 시장입니다.",
    badge: "일반",
    badgeColor: "bg-green-100 text-green-800",
  },
  secret: {
    title: "비밀 시장",
    description: "신비로운 물건들이 거래되는 비밀스러운 시장입니다.",
    badge: "비밀",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  black: {
    title: "흑시장",
    description: "어둠 속에서 이루어지는 위험한 거래의 장소입니다.",
    badge: "위험",
    badgeColor: "bg-red-100 text-red-800",
  },
};

interface TownClientProps {
  initialMarketType: MarketType;
  marketImage: string | null;
}

export default function TownClient({
  initialMarketType,
  marketImage,
}: TownClientProps) {
  const [marketType, setMarketType] = useState<MarketType>(initialMarketType);
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [buyingCharacterId, setBuyingCharacterId] = useState<string>("");
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);

  useEffect(() => {
    fetchCharacters();
    fetchMarket();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "캐릭터 목록을 불러오는데 실패했습니다.",
      });
    }
  };

  const fetchMarket = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/market?marketType=${marketType}`);
      const data = await response.json();
      setMarketType(data.marketType);
      setItems(data.items);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "시장 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyItem = async (item: Item, characterId: string) => {
    const character = characters.find((c) => c._id.toString() === characterId);
    if (!character) return;

    if (character.gold < item.value) {
      toast({
        variant: "destructive",
        title: "골드 부족",
        description: "아이템을 구매하기 위한 골드가 부족합니다.",
      });
      return;
    }

    if (character.level < item.requiredLevel) {
      toast({
        variant: "destructive",
        title: "레벨 제한",
        description: `이 아이템은 ${item.requiredLevel}레벨 이상만 구매할 수 있습니다.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/market", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId,
          itemId: item._id,
        }),
      });

      if (!response.ok) throw new Error();

      await fetchCharacters();
      toast({
        title: "구매 완료",
        description: `${character.name}(이)가 ${item.name}을(를) 구매했습니다.`,
      });
      setShowPurchaseDialog(false);
      setBuyingCharacterId("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "오류",
        description: "아이템 구매에 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return "text-amber-500";
      case "epic":
        return "text-purple-500";
      case "rare":
        return "text-blue-500";
      case "uncommon":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getEffectDescription = (effectType: string) => {
    const effectMap: Record<string, string> = {
      strength_bonus: "힘",
      dexterity_bonus: "민첩",
      constitution_bonus: "체력",
      intelligence_bonus: "지능",
      wisdom_bonus: "지혜",
      charisma_bonus: "매력",
      hp_max_bonus: "최대 체력",
      spell_damage_bonus: "주문 공격력",
      heal: "치유량",
      spell_save_dc_bonus: "주문 내성 DC",
      resource_max_bonus: "자원 최대치",
      spell_slots_bonus: "주문 슬롯",
      all_saves_bonus: "모든 내성 굴림",
      all_stats_boost: "모든 능력치",
      restore_resource: "자원 회복",
      restore_spell_slot: "주문 슬롯 회복",
      strength_boost: "힘 증가",
      dexterity_boost: "민첩 증가",
    };

    return effectMap[effectType] || effectType;
  };

  const MarketHeader = () => {
    const marketInfo = MARKET_INFO[marketType];

    return (
      <div className="relative h-48 lg:h-64 overflow-hidden rounded-t-lg">
        {marketImage && (
          <img
            src={marketImage}
            alt="Market"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-white">
              {marketInfo.title}
            </h2>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${marketInfo.badgeColor}`}
            >
              {marketInfo.badge}
            </span>
          </div>
          <p className="text-white/90 text-sm max-w-2xl">
            {marketInfo.description}
          </p>
        </div>
      </div>
    );
  };

  console.log("items", items);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Store className="h-8 w-8" />
          <h1 className="text-4xl font-bold tracking-tight">마을 상점</h1>
        </div>
        <p className="text-muted-foreground">
          다양한 상인들과 거래할 수 있는 신비로운 장소입니다
        </p>
      </div>

      <Card className="overflow-hidden">
        <MarketHeader />
        <div className="p-4 bg-muted/50 border-t">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {items.length}개의 아이템이 거래되고 있습니다
            </p>
            {characters.length > 0 && (
              <p className="text-sm">보유 캐릭터: {characters.length}명</p>
            )}
          </div>
        </div>
      </Card>

      {/* 상품 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          items.map((item) => (
            <Card
              key={item._id.toString()}
              className="p-4 hover:shadow-lg transition-shadow relative"
            >
              <div className="space-y-4 min-h-[200px]">
                {/* 이름과 가격 */}
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-semibold ${getRarityColor(item.rarity)}`}
                  >
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    <span>{item.value} Gold</span>
                  </div>
                </div>

                {/* 장비 정보 */}
                <div className="space-y-3">
                  {/* 아이템 타입 */}
                  <div className="flex items-center gap-2">
                    {item.type === "weapon" && <Sword className="h-4 w-4" />}
                    {item.type === "shield" && <Shield className="h-4 w-4" />}
                    {(item.type === "light-armor" ||
                      item.type === "medium-armor" ||
                      item.type === "heavy-armor") && (
                      <Shield className="h-4 w-4" />
                    )}
                    {item.type === "accessory" && (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {item.type === "weapon"
                        ? "무기"
                        : item.type === "light-armor"
                        ? "경갑옷"
                        : item.type === "medium-armor"
                        ? "중갑옷"
                        : item.type === "heavy-armor"
                        ? "중갑옷"
                        : item.type === "shield"
                        ? "방패"
                        : item.type === "accessory"
                        ? "장신구"
                        : "소비품"}
                    </span>
                  </div>

                  {/* 레벨 요구사항 */}
                  <div className="text-sm text-muted-foreground">
                    필요 레벨: {item.requiredLevel}
                  </div>

                  {/* 기본 스탯 (데미지/방어력) */}
                  {(item.stats?.damage || item.stats?.defense) && (
                    <div className="flex gap-4 text-sm">
                      {item.stats?.damage && (
                        <div className="flex items-center gap-1">
                          <Sword className="h-3 w-3" />
                          피해량: {item.stats.damage}
                        </div>
                      )}
                      {item.stats?.defense && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          방어력: {item.stats.defense}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 특수 효과 */}
                  {item.stats.effects && item.stats.effects.length > 0 && (
                    <div className="space-y-1">
                      {item.stats.effects.map((effect, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-blue-500"
                        >
                          <Star className="h-3 w-3" />
                          <span>
                            {getEffectDescription(effect.type)}: {effect.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 구매 버튼 - absolute positioning으로 하단 고정 */}
                <div className="absolute bottom-4 left-4 right-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowPurchaseDialog(true);
                    }}
                  >
                    구매하기
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 아이템 구매 다이얼로그 */}
      <Dialog
        open={showPurchaseDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowPurchaseDialog(false);
            setBuyingCharacterId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>아이템 구매</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                {/* 아이템 정보 */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`font-semibold ${getRarityColor(
                          selectedItem?.rarity || "common"
                        )}`}
                      >
                        {selectedItem?.name}
                        <span className="ml-2 text-sm text-muted-foreground">
                          (
                          {selectedItem?.type === "weapon"
                            ? "무기"
                            : selectedItem?.type === "light-armor"
                            ? "경갑옷"
                            : selectedItem?.type === "medium-armor"
                            ? "중갑옷"
                            : selectedItem?.type === "heavy-armor"
                            ? "중갑옷"
                            : selectedItem?.type === "shield"
                            ? "방패"
                            : selectedItem?.type === "accessory"
                            ? "장신구"
                            : "소비품"}
                          )
                        </span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        <span>{selectedItem?.value} Gold</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem?.stats.damage && (
                        <div className="flex items-center gap-2">
                          <Sword className="h-4 w-4" />
                          <span>피해량: {selectedItem.stats.damage}</span>
                        </div>
                      )}
                      {selectedItem?.stats.defense && (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>방어력: {selectedItem.stats.defense}</span>
                        </div>
                      )}
                    </div>

                    {selectedItem?.stats.effects.map((effect, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-blue-500"
                      >
                        <Star className="h-4 w-4" />
                        <span>
                          {getEffectDescription(effect.type)}: {effect.value}
                        </span>
                      </div>
                    ))}

                    <div className="text-sm text-muted-foreground">
                      필요 레벨: {selectedItem?.requiredLevel}
                    </div>
                  </div>
                </Card>

                {/* 캐릭터 선택 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    구매할 캐릭터 선택
                  </label>
                  <Select
                    value={buyingCharacterId}
                    onValueChange={setBuyingCharacterId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="캐릭터를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem
                          key={character._id.toString()}
                          value={character._id.toString()}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span>
                              {character.name} (Lv.{character.level})
                            </span>
                            <span className="ml-2">{character.gold} Gold</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 선택된 캐릭터 정보 및 구매 가능 여부 표시 */}
                {buyingCharacterId && selectedItem && (
                  <Card className="p-4 bg-muted">
                    {(() => {
                      const character = characters.find(
                        (c) => c._id.toString() === buyingCharacterId
                      );
                      if (!character) return null;

                      const hasEnoughGold =
                        character.gold >= selectedItem.value;
                      const hasRequiredLevel =
                        character.level >= selectedItem.requiredLevel;

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              구매 후 남은 골드
                            </span>
                            <span>
                              {character.gold - selectedItem.value} Gold
                            </span>
                          </div>

                          {/* 구매 조건 체크 표시 */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <div
                                className={
                                  hasEnoughGold
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {hasEnoughGold ? "✓" : "✗"} 필요 골드:{" "}
                                {selectedItem.value} Gold
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div
                                className={
                                  hasRequiredLevel
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                {hasRequiredLevel ? "✓" : "✗"} 필요 레벨:{" "}
                                {selectedItem.requiredLevel}
                              </div>
                            </div>
                          </div>

                          {/* 구매 불가 시 경고 메시지 */}
                          {(!hasEnoughGold || !hasRequiredLevel) && (
                            <div className="text-sm text-red-500 mt-2">
                              {!hasEnoughGold && (
                                <p>
                                  골드가 부족합니다 (부족:{" "}
                                  {selectedItem.value - character.gold} Gold)
                                </p>
                              )}
                              {!hasRequiredLevel && (
                                <p>
                                  레벨이 부족합니다 (필요:{" "}
                                  {selectedItem.requiredLevel - character.level}{" "}
                                  레벨)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </Card>
                )}

                {/* 구매 버튼 */}
                <Button
                  className="w-full"
                  disabled={
                    !buyingCharacterId ||
                    !selectedItem ||
                    (() => {
                      const character = characters.find(
                        (c) => c._id.toString() === buyingCharacterId
                      );
                      if (!character) return true;
                      return (
                        character.gold < selectedItem.value ||
                        character.level < selectedItem.requiredLevel
                      );
                    })()
                  }
                  onClick={() => {
                    if (selectedItem && buyingCharacterId) {
                      handleBuyItem(selectedItem, buyingCharacterId);
                    }
                  }}
                >
                  구매 확인
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
