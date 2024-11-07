"use client";

import useSWR from "swr";
import CharacterHeader from "./CharacterHeader";
import CharacterStats from "./CharacterStats";
import CharacterEquipment from "./CharacterEquipment";
import CharacterFeatures from "./CharacterFeatures";
import CharacterProficiencies from "./CharacterProficiencies";
import CharacterArenaStats from "./CharacterArenaStats";
import CharacterInventory from "./CharacterInventory";
import { redirect } from "next/navigation";

interface Character {
  stats: any;
  proficiencies: any;
  equipment: any;
  inventory: any;
  gold: number;
  features: any;
  spells: any;
  class: string;
  arenaStats: any;
}

interface CharacterClientProps {
  id: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch character");
  }
  return res.json();
};

export function CharacterClient({ id }: CharacterClientProps) {
  const {
    data: character,
    error,
    isLoading,
  } = useSWR<Character>(`/api/characters/${id}`, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0, // 자동 리프레시 비활성화
    shouldRetryOnError: false,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-lg">Loading character data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    redirect("/characters");
  }

  if (!character) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
          <CharacterHeader character={character} />
        </div>

        <div className="space-y-6">
          <CharacterStats stats={character.stats} />
          <CharacterProficiencies proficiencies={character.proficiencies} />
        </div>

        <div className="space-y-6">
          <CharacterEquipment equipment={character.equipment} />
          <CharacterInventory
            inventory={character.inventory}
            gold={character.gold}
          />
        </div>

        <div className="space-y-6">
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
