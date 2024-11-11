"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
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
  Search,
  Store,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Character, Item } from "@/app/types";

type MarketType = "normal" | "secret" | "black";

type MarketTab = "buy" | "sell";

interface MarketInfo {
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
}

const MARKET_INFO: Record<MarketType, MarketInfo> = {
  normal: {
    title: "마을 시장",
    description:
      "누구나 찾을 수 있는 마을의 중심가. 물건을 사고파는 상인들의 활기찬 목소리와 흥정하는 사람들로 늘 북적입니다. 평화로운 분위기 속에서 일상적인 거래가 이루어지는 정겨운 장소입니다.",
    badge: "일반",
    badgeColor: "bg-green-100 text-green-800",
  },
  secret: {
    title: "비밀 시장",
    description:
      "평범한 상점가 어딘가에 숨겨진 비밀스러운 공간입니다. 이런 특별한 장소를 발견하다니, 오늘은 정말 행운이 따랐네요! 진귀한 물건들을 구경할 수 있는 기회를 놓치지 마세요.",
    badge: "비밀",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  black: {
    title: "흑시장",
    description:
      "어두운 골목을 지나다 우연히 마주친 은밀한 거래의 장소입니다. 모험가들이 획득한 특별한 물건들이 은밀히 거래되는 곳이죠. 위험할 수도 있지만, 누군가에겐 꼭 필요한 물건을 찾을 수 있을지도 모릅니다.",
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
  const [activeTab, setActiveTab] = useState<MarketTab>("buy");
  const [selectedCharacterForSell, setSelectedCharacterForSell] =
    useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [charactersInDungeon, setCharactersInDungeon] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchCharacters();
    fetchMarket();
  }, []);

  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchLower) ||
      item.type.toLowerCase().includes(searchLower) ||
      item.rarity.toLowerCase().includes(searchLower)
    );
  });

  const checkDungeonStatus = async (characters: Character[]) => {
    try {
      const dungeonStatuses = await Promise.all(
        characters.map(async (character) => {
          const response = await fetch(
            `/api/dungeon/active?characterId=${character._id}`
          );
          const data = await response.json();
          return {
            characterId: character._id.toString(),
            inDungeon: !!data.dungeon,
          };
        })
      );

      const inDungeonIds = new Set(
        dungeonStatuses
          .filter((status) => status.inDungeon)
          .map((status) => status.characterId)
      );
      setCharactersInDungeon(inDungeonIds);
    } catch (error) {
      console.error("Failed to check dungeon status:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "캐릭터 상태 확인에 실패했습니다.",
      });
    }
  };

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      const data = await response.json();
      setCharacters(data.characters);
      await checkDungeonStatus(data.characters);
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
    if (charactersInDungeon.has(characterId)) {
      toast({
        variant: "destructive",
        title: "구매 불가",
        description: "던전에서 탐험 중인 캐릭터는 아이템을 구매할 수 없습니다.",
      });
      return;
    }

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

  const handleSellItems = async (
    characterId: string,
    inventoryIds: string[]
  ) => {
    if (!characterId || inventoryIds.length === 0) return;
    if (charactersInDungeon.has(characterId)) {
      toast({
        variant: "destructive",
        title: "판매 불가",
        description: "던전에서 탐험 중인 캐릭터는 아이템을 판매할 수 없습니다.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/market", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          characterId,
          inventoryIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();

      await fetchCharacters();

      toast({
        title: "판매 완료",
        description: `${inventoryIds.length}개의 아이템을 ${data.soldPrice} Gold에 판매했습니다.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "판매 실패",
        description:
          error instanceof Error
            ? error.message
            : "아이템 판매에 실패했습니다.",
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

  const groupInventoryItems = (inventory: any[]) => {
    const groups = inventory.reduce((acc, item) => {
      const key = `${item.name}-${item.value}-${item.type}`;
      if (!acc[key]) {
        acc[key] = {
          ...item,
          count: 1,
          inventoryIds: [item._id.toString()],
        };
      } else {
        acc[key].count++;
        acc[key].inventoryIds.push(item._id.toString());
      }
      return acc;
    }, {});

    return Object.values(groups);
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

  const renderPurchaseDialogContent = () => (
    <SelectContent>
      {characters.map((character) => {
        const inDungeon = charactersInDungeon.has(character._id.toString());
        return (
          <SelectItem
            key={character._id.toString()}
            value={character._id.toString()}
            disabled={inDungeon}
          >
            <div className="flex justify-between items-center w-full">
              <span className="flex items-center gap-2">
                {character.name} (Lv.{character.level})
                {inDungeon && (
                  <span className="text-xs text-red-500">(던전 탐험 중)</span>
                )}
              </span>
              <span className="ml-2">{character.gold} Gold</span>
            </div>
          </SelectItem>
        );
      })}
    </SelectContent>
  );

  const renderSellTab = () => {
    const selectedCharacter = characters.find(
      (c) => c._id.toString() === selectedCharacterForSell
    );

    const groupedItems = selectedCharacter
      ? groupInventoryItems(selectedCharacter.inventory)
      : [];

    const renderSellTabCharacterSelect = () => (
      <Card className="p-4">
        <Select
          value={selectedCharacterForSell}
          onValueChange={setSelectedCharacterForSell}
        >
          <SelectTrigger>
            <SelectValue placeholder="캐릭터를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {characters.map((character) => {
              const inDungeon = charactersInDungeon.has(
                character._id.toString()
              );
              return (
                <SelectItem
                  key={character._id.toString()}
                  value={character._id.toString()}
                  disabled={inDungeon}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="flex items-center gap-2">
                      {character.name} (Lv.{character.level})
                      {inDungeon && (
                        <span className="text-xs text-red-500">
                          (던전 탐험 중)
                        </span>
                      )}
                    </span>
                    <span className="ml-2">{character.gold} Gold</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Card>
    );

    return (
      <div className="space-y-6">
        {/* 캐릭터 선택 */}
        {renderSellTabCharacterSelect()}

        {/* 인벤토리 아이템 목록 */}
        {selectedCharacter && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedItems.map((item: any) => (
              <Card
                key={item.inventoryIds[0]}
                className="p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col min-h-[200px]">
                  {/* 상단 정보: 이름, 가격, 수량 */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className={`font-semibold ${getRarityColor(
                          item.rarity
                        )}`}
                      >
                        {item.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        보유: {item.count}개
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="h-4 w-4" />
                      <span>{Math.floor(item.value * 0.6)} Gold/개</span>
                    </div>
                  </div>

                  {/* 중단 정보: 아이템 세부사항 */}
                  <div className="flex-grow space-y-3 mb-4">
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
                          : "장신구"}
                      </span>
                    </div>

                    {/* 레벨 요구사항 */}
                    <div className="text-sm text-muted-foreground">
                      필요 레벨: {item.requiredLevel}
                    </div>

                    {/* 기본 스탯 */}
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
                        {item.stats.effects.map(
                          (effect: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-blue-500"
                            >
                              <Star className="h-3 w-3" />
                              <span>
                                {getEffectDescription(effect.type)}:{" "}
                                {effect.value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* 하단 버튼 */}
                  <div className="mt-auto space-y-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        handleSellItems(
                          selectedCharacter._id.toString(),
                          [item.inventoryIds[0]] // 1개만 판매
                        )
                      }
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Coins className="h-4 w-4 mr-2" />
                      )}
                      1개 판매 ({Math.floor(item.value * 0.6)} Gold)
                    </Button>

                    {item.count > 1 && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() =>
                          handleSellItems(
                            selectedCharacter._id.toString(),
                            item.inventoryIds // 전체 판매
                          )
                        }
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Coins className="h-4 w-4 mr-2" />
                        )}
                        전체 판매 ({Math.floor(item.value * 0.6 * item.count)}{" "}
                        Gold)
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* 상단 타이틀 섹션 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Store className="h-8 w-8" />
          <h1 className="text-4xl font-bold tracking-tight">마을 상점</h1>
        </div>
        <p className="text-muted-foreground">
          다양한 상인들과 거래할 수 있는 신비로운 장소입니다
        </p>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 상점 이미지 & 분위기 */}
        <div className="space-y-6">
          {marketImage && (
            <div className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-black/5">
                <img
                  src={marketImage}
                  alt="Market"
                  className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="mt-4 bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground italic text-center">
                  {MARKET_INFO[marketType].description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 거래 인터페이스 */}
        <div className="space-y-6">
          {/* 마켓 정보 카드 */}
          <Card className="overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">
                    {MARKET_INFO[marketType].title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {items.length}개의 아이템이 거래되고 있습니다
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${MARKET_INFO[marketType].badgeColor}`}
                >
                  {MARKET_INFO[marketType].badge}
                </span>
              </div>

              {/* 구매/판매 탭 */}
              <div className="flex justify-center gap-4">
                <Button
                  variant={activeTab === "buy" ? "default" : "outline"}
                  onClick={() => setActiveTab("buy")}
                >
                  구매
                </Button>
                <Button
                  variant={activeTab === "sell" ? "default" : "outline"}
                  onClick={() => setActiveTab("sell")}
                >
                  판매
                </Button>
              </div>
            </div>
          </Card>

          {/* 캐릭터 정보 */}
          {characters.length > 0 && (
            <Card className="p-4 bg-muted">
              <p className="text-sm text-center">
                보유 캐릭터: {characters.length}명
              </p>
            </Card>
          )}

          {activeTab === "buy" && (
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="아이템 이름, 종류, 등급으로 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </Card>
          )}

          {/* 탭 컨텐츠 */}
          <div className="space-y-4">
            {activeTab === "buy" ? (
              <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  <Card className="p-8">
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  </Card>
                ) : (
                  filteredItems.map((item) => (
                    <Card
                      key={item._id.toString()}
                      className="p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col h-full">
                        {/* 이름과 가격 */}
                        <div className="flex items-center justify-between mb-4">
                          <h3
                            className={`font-semibold ${getRarityColor(
                              item.rarity
                            )}`}
                          >
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4" />
                            <span>{item.value} Gold</span>
                          </div>
                        </div>

                        {/* 장비 정보 */}
                        <div className="flex-grow space-y-3 mb-4">
                          {/* 아이템 타입 */}
                          <div className="flex items-center gap-2">
                            {item.type === "weapon" && (
                              <Sword className="h-4 w-4" />
                            )}
                            {item.type === "shield" && (
                              <Shield className="h-4 w-4" />
                            )}
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
                          {item.stats?.effects &&
                            item.stats.effects.length > 0 && (
                              <div className="space-y-1">
                                {item.stats.effects.map((effect, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-blue-500"
                                  >
                                    <Star className="h-3 w-3" />
                                    <span>
                                      {getEffectDescription(effect.type)}:{" "}
                                      {effect.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        {/* 구매 버튼 */}
                        <div className="mt-auto">
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
            ) : (
              renderSellTab()
            )}
          </div>
        </div>
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
                    {renderPurchaseDialogContent()}
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
