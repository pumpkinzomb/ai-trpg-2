"use client";

import { useState } from "react";
import useSWR from "swr";
import CharacterHeader from "./CharacterHeader";
import CharacterStats from "./CharacterStats";
import CharacterEquipment from "./CharacterEquipment";
import CharacterFeatures from "./CharacterFeatures";
import CharacterProficiencies from "./CharacterProficiencies";
import CharacterArenaStats from "./CharacterArenaStats";
import CharacterInventory from "./CharacterInventory";
import { redirect } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Item, Character } from "@/app/types";
import { checkArmorClassRestriction } from "@/app/utils/character";
import LoadingSpinner from "@/components/loading";

interface CharacterClientProps {
  id: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch character");
  return res.json();
};

export function CharacterClient({ id }: CharacterClientProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: character,
    error,
    mutate: refreshCharacter,
    isLoading: isInitialLoading,
  } = useSWR<Character>(`/api/characters/${id}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    shouldRetryOnError: false,
  });

  const handleEquipItem = async (item: Item) => {
    if (!character) return;

    setIsLoading(true);
    try {
      let slot: string;
      let updatedEquipment = { ...character.equipment };
      let updatedInventory = [...character.inventory];

      // 장비 슬롯 결정
      switch (item.type) {
        case "weapon":
          slot = "weapon";
          if (updatedEquipment.weapon) {
            updatedInventory.push(updatedEquipment.weapon);
          }
          updatedEquipment.weapon = item;
          break;
        case "light-armor":
        case "medium-armor":
        case "heavy-armor":
          // 캐릭터 클래스에 따른 방어구 착용 제한 체크
          const canEquipArmor = checkArmorClassRestriction(
            character.class,
            item.type
          );
          if (!canEquipArmor) {
            toast({
              variant: "destructive",
              title: "장비 실패",
              description: `${character.class} 클래스는 ${item.type}을(를) 착용할 수 없습니다.`,
            });
            return;
          }

          slot = "armor";
          if (updatedEquipment.armor) {
            updatedInventory.push(updatedEquipment.armor);
          }
          updatedEquipment.armor = item;
          break;
        case "shield":
          slot = "shield";
          if (updatedEquipment.shield) {
            updatedInventory.push(updatedEquipment.shield);
          }
          updatedEquipment.shield = item;
          break;
        case "accessory":
          slot = "accessories";
          if (updatedEquipment.accessories.length >= 4) {
            toast({
              variant: "destructive",
              title: "장비 실패",
              description: "액세서리 슬롯이 가득 찼습니다.",
            });
            return;
          }
          updatedEquipment.accessories.push(item);
          break;
        default:
          return;
      }

      // 인벤토리에서 아이템 제거
      updatedInventory = updatedInventory.filter((i) => i._id !== item._id);

      const response = await fetch(`/api/characters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipment: updatedEquipment,
          inventory: updatedInventory,
        }),
      });

      if (!response.ok) throw new Error("Failed to equip item");

      await refreshCharacter();
      toast({
        title: "장비 장착 완료",
        description: `${item.name}을(를) 장착했습니다.`,
      });
    } catch (error) {
      console.error("Error equipping item:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "장비 장착 중 문제가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnequipItem = async (slot: string, index?: number) => {
    if (!character) return;

    setIsLoading(true);
    try {
      let updatedEquipment = { ...character.equipment };
      let updatedInventory = [...character.inventory];
      let unequippedItem: Item | null = null;

      // type이 "accessory"인 경우의 처리
      if (slot === "accessory" && typeof index === "number") {
        if (index >= 0 && index < updatedEquipment.accessories.length) {
          updatedEquipment.accessories = [...updatedEquipment.accessories];
          unequippedItem = { ...updatedEquipment.accessories[index] };
          updatedEquipment.accessories.splice(index, 1);
        } else {
          throw new Error("액세서리 인덱스가 잘못되었습니다");
        }
      } else {
        // 다른 장비 슬롯 처리
        switch (slot) {
          case "weapon":
            unequippedItem = updatedEquipment.weapon
              ? { ...updatedEquipment.weapon }
              : null;
            updatedEquipment.weapon = null;
            break;
          case "armor":
            // armor 슬롯에 장착된 아이템이 있는 경우
            if (updatedEquipment.armor) {
              const armorType = updatedEquipment.armor.type;
              // armor 타입 검증
              if (
                armorType === "light-armor" ||
                armorType === "medium-armor" ||
                armorType === "heavy-armor"
              ) {
                unequippedItem = { ...updatedEquipment.armor };
                updatedEquipment.armor = null;
              } else {
                throw new Error("잘못된 방어구 타입입니다");
              }
            }
            break;
          case "shield":
            unequippedItem = updatedEquipment.shield
              ? { ...updatedEquipment.shield }
              : null;
            updatedEquipment.shield = null;
            break;
          default:
            throw new Error("잘못된 장비 슬롯입니다");
        }
      }

      if (unequippedItem) {
        updatedInventory.push(unequippedItem);
      }

      const response = await fetch(`/api/characters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          equipment: updatedEquipment,
          inventory: updatedInventory,
        }),
      });

      if (!response.ok) throw new Error("Failed to unequip item");

      await refreshCharacter();

      // 방어구 타입에 따른 메시지 생성
      let itemTypeDisplay = "";
      if (unequippedItem?.type === "light-armor") itemTypeDisplay = "경장 갑옷";
      else if (unequippedItem?.type === "medium-armor")
        itemTypeDisplay = "중장 갑옷";
      else if (unequippedItem?.type === "heavy-armor")
        itemTypeDisplay = "중갑 갑옷";

      toast({
        title: "장비 해제 완료",
        description: unequippedItem
          ? `${unequippedItem.name}${
              itemTypeDisplay ? ` (${itemTypeDisplay})` : ""
            }을(를) 해제했습니다.`
          : "장비를 해제했습니다.",
      });
    } catch (error) {
      console.error("Error unequipping item:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description:
          error instanceof Error
            ? error.message
            : "장비 해제 중 문제가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    redirect("/characters");
  }

  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-6 px-4 min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <CharacterHeader character={character} />
        </div>

        <div className="space-y-6">
          <CharacterStats
            stats={character.stats}
            equipment={character.equipment}
            features={character.features}
            race={character.race}
          />
          <CharacterProficiencies proficiencies={character.proficiencies} />
        </div>

        <div className="space-y-6">
          <CharacterEquipment
            equipment={character.equipment}
            inventory={character.inventory}
            onEquip={handleEquipItem}
            onUnequip={handleUnequipItem}
            characterLevel={character.level}
          />
        </div>

        <div className="space-y-6">
          <CharacterInventory
            inventory={character.inventory}
            gold={character.gold}
            onEquip={handleEquipItem}
            characterLevel={character.level}
          />
          <CharacterFeatures
            features={character.features}
            spells={character.spells}
            class={character.class}
          />
          <CharacterArenaStats arenaStats={character.arenaStats} />
        </div>
      </div>
    </div>
  );
}
