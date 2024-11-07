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
import { Item, ItemEffect, Character } from "@/app/types";

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
  } = useSWR<Character>(`/api/characters/${id}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    shouldRetryOnError: false,
  });

  // 장비 효과를 반영한 최종 스탯 계산
  const calculateFinalStats = (
    baseStats: Character["stats"],
    equipment: Character["equipment"]
  ) => {
    const finalStats = { ...baseStats };
    const allItems = [
      equipment.weapon,
      equipment.armor,
      equipment.shield,
      ...equipment.accessories,
    ].filter(Boolean);

    allItems.forEach((item) => {
      item?.stats.effects.forEach((effect: ItemEffect) => {
        if (effect.type.toLowerCase().includes("strength")) {
          finalStats.strength += parseInt(effect.value) || 0;
        }
        if (effect.type.toLowerCase().includes("dexterity")) {
          finalStats.dexterity += parseInt(effect.value) || 0;
        }
        if (effect.type.toLowerCase().includes("constitution")) {
          finalStats.constitution += parseInt(effect.value) || 0;
        }
        if (effect.type.toLowerCase().includes("intelligence")) {
          finalStats.intelligence += parseInt(effect.value) || 0;
        }
        if (effect.type.toLowerCase().includes("wisdom")) {
          finalStats.wisdom += parseInt(effect.value) || 0;
        }
        if (effect.type.toLowerCase().includes("charisma")) {
          finalStats.charisma += parseInt(effect.value) || 0;
        }
      });
    });

    return finalStats;
  };

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
        case "armor":
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
          // 액세서리 배열의 깊은 복사
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
            unequippedItem = updatedEquipment.armor
              ? { ...updatedEquipment.armor }
              : null;
            updatedEquipment.armor = null;
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
      toast({
        title: "장비 해제 완료",
        description: unequippedItem
          ? `${unequippedItem.name}을(를) 해제했습니다.`
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

  if (!character) {
    return null;
  }

  const finalStats = calculateFinalStats(character.stats, character.equipment);

  return (
    <div className="container mx-auto py-6 px-4">
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
