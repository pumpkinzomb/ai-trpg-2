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
  Heart,
  Scroll,
  Sparkles,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Character, Item } from "@/app/types";

interface TownClientProps {
  initialMarketType: string;
  marketImage: string | null;
}

export default function TownClient({
  initialMarketType,
  marketImage,
}: TownClientProps) {
  const [marketType, setMarketType] = useState(initialMarketType);
  const { toast } = useToast();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState("market");

  useEffect(() => {
    fetchCharacters();
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
    if (!selectedCharacter) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/market?level=${selectedCharacter.level}&marketType=${marketType}`
      );
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

  const handleBuyItem = async (item: Item) => {
    if (!selectedCharacter) return;

    if (selectedCharacter.gold < item.value) {
      toast({
        variant: "destructive",
        title: "골드 부족",
        description: "아이템을 구매하기 위한 골드가 부족합니다.",
      });
      return;
    }

    if (selectedCharacter.level < item.requiredLevel) {
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
          characterId: selectedCharacter._id,
          itemId: item._id,
        }),
      });

      if (!response.ok) throw new Error();

      await fetchCharacters();
      toast({
        title: "구매 완료",
        description: `${item.name}을(를) 구매했습니다.`,
      });
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

  const getMarketTitle = () => {
    switch (marketType) {
      case "secret":
        return "비밀 시장";
      case "black":
        return "흑시장";
      default:
        return "마을 시장";
    }
  };

  const getMarketDescription = () => {
    switch (marketType) {
      case "secret":
        return "신비로운 물건들이 거래되는 비밀스러운 시장입니다.";
      case "black":
        return "어둠 속에서 이루어지는 위험한 거래의 장소입니다.";
      default:
        return "평화로운 마을의 일반적인 시장입니다.";
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

  const renderCharacterStats = () => {
    if (!selectedCharacter) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">기본 정보</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>레벨: {selectedCharacter.level}</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span>
                HP: {selectedCharacter.hp.current}/{selectedCharacter.hp.max}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Scroll className="h-4 w-4 text-blue-500" />
              <span>
                {selectedCharacter.resource.name}:{" "}
                {selectedCharacter.resource.current}/
                {selectedCharacter.resource.max}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2">능력치</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>힘: {selectedCharacter.stats.strength}</div>
            <div>민첩: {selectedCharacter.stats.dexterity}</div>
            <div>체력: {selectedCharacter.stats.constitution}</div>
            <div>지능: {selectedCharacter.stats.intelligence}</div>
            <div>지혜: {selectedCharacter.stats.wisdom}</div>
            <div>매력: {selectedCharacter.stats.charisma}</div>
          </div>
        </Card>

        <Card className="p-4 md:col-span-2">
          <h3 className="font-semibold mb-2">장착 장비</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">무기</span>
              <div className="p-2 border rounded-lg">
                {selectedCharacter.equipment.weapon ? (
                  <div className="flex items-center gap-2">
                    <Sword className="h-4 w-4" />
                    <span>{selectedCharacter.equipment.weapon.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">방어구</span>
              <div className="p-2 border rounded-lg">
                {selectedCharacter.equipment.armor ? (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{selectedCharacter.equipment.armor.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">방패</span>
              <div className="p-2 border rounded-lg">
                {selectedCharacter.equipment.shield ? (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{selectedCharacter.equipment.shield.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">장신구</span>
              <div className="p-2 border rounded-lg">
                {selectedCharacter.equipment.accessories.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {selectedCharacter.equipment.accessories[0].name}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">마을</h1>
          <p className="text-muted-foreground">
            마을에서 거래하고 휴식을 취할 수 있습니다
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">캐릭터 선택</label>
              <Select
                onValueChange={(value) => {
                  const char = characters.find(
                    (c) => c._id.toString() === value
                  );
                  setSelectedCharacter(char || null);
                  if (char) fetchMarket();
                }}
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
                      {character.name} (Lv.{character.level}) - {character.gold}{" "}
                      Gold
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {selectedCharacter && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="character">캐릭터 정보</TabsTrigger>
              <TabsTrigger value="market">시장</TabsTrigger>
            </TabsList>

            {/* 캐릭터 정보 탭 */}
            <TabsContent value="character" className="space-y-6">
              {renderCharacterStats()}
            </TabsContent>

            {/* 시장 탭 */}
            <TabsContent value="market" className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 시장 정보 섹션 */}
                  <div className="space-y-6">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      {marketImage && (
                        <img
                          src={marketImage}
                          alt="Market"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h2 className="text-2xl font-bold text-white">
                          {getMarketTitle()}
                        </h2>
                        <p className="text-white/80 text-sm">
                          {getMarketDescription()}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="h-5 w-5" />
                          <span>보유 골드: {selectedCharacter.gold}</span>
                        </div>
                        <Button
                          variant="outline"
                          onClick={fetchMarket}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              갱신 중...
                            </>
                          ) : (
                            "시장 갱신"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 아이템 목록 섹션 */}
                  <div className="space-y-4">
                    {items.map((item) => (
                      <Card
                        key={item._id.toString()}
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3
                                className={`font-semibold ${getRarityColor(
                                  item.rarity
                                )}`}
                              >
                                {item.name}
                              </h3>
                              {item.requiredLevel > selectedCharacter.level && (
                                <span className="text-xs text-red-500">
                                  (Lv.{item.requiredLevel} 필요)
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
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
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{item.value} Gold</span>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyItem(item);
                              }}
                              disabled={
                                isLoading ||
                                selectedCharacter.gold < item.value ||
                                selectedCharacter.level < item.requiredLevel
                              }
                            >
                              구매
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* 아이템 상세 정보 다이얼로그 */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-2 ${getRarityColor(
                  selectedItem?.rarity || "common"
                )}`}
              >
                {selectedItem?.name}
                <span className="text-sm text-muted-foreground">
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
              </DialogTitle>
              <DialogDescription>
                <div className="space-y-4 mt-4">
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
                  {selectedItem?.stats.effects?.map((effect, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>
                        {effect.type}: {effect.value}
                      </span>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          필요 레벨: {selectedItem?.requiredLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        <span>{selectedItem?.value} Gold</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (selectedItem) {
                          handleBuyItem(selectedItem);
                          setSelectedItem(null);
                        }
                      }}
                      disabled={
                        isLoading ||
                        !selectedCharacter ||
                        (selectedItem &&
                          selectedCharacter.gold < selectedItem.value) ||
                        (selectedItem &&
                          selectedCharacter.level <
                            selectedItem.requiredLevel) ||
                        undefined
                      }
                    >
                      구매하기
                    </Button>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
