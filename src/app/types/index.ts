import { Types } from "mongoose";

export interface Character {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  level: number;
  experience: number;
  class: string;
  race: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  proficiencies: string[];
  hp: {
    current: number;
    max: number;
    hitDice: string;
  };
  spells: {
    known: Spell[];
    slots: {
      level: number;
      total: number;
      used: number;
    }[];
  };
  features: {
    name: string;
    type: "passive" | "active";
    effect: string;
  }[];
  resource: {
    current: number;
    max: number;
    name: string;
  };
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    shield: Item | null;
    accessories: Item[];
  };
  inventory: Item[];
  gold: number;
  arenaStats: {
    rank: number;
    rating: number;
    wins: number;
    losses: number;
  };
  profileImage: string;
}

export interface Spell {
  // 스펠 정보를 별도 컬렉션으로
  _id: Types.ObjectId;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  effect: {
    type: string; // "damage", "heal", "buff" 등
    dice?: string; // "2d6" 등
    bonus?: number;
  };
  description: string;
}

export interface Combat {
  // 전투 시스템 단순화
  _id: Types.ObjectId;
  characterId: Types.ObjectId;
  type: "pve" | "pvp";
  opponent: {
    id?: Types.ObjectId;
    name: string;
    stats: any;
  };
  rounds: {
    attacker: string;
    action: string;
    rolls: {
      type: string;
      dice: string;
      result: number;
      advantage?: boolean;
    }[];
    damage?: number;
    effects?: string[];
  }[];
  result: "victory" | "defeat";
  rewards?: {
    experience: number;
    gold: number;
    items: Types.ObjectId[];
  };
}

export interface Item {
  _id: Types.ObjectId;
  name: string;
  type:
    | "weapon"
    | "light-armor"
    | "medium-armor"
    | "heavy-armor"
    | "shield"
    | "accessory"
    | "consumable";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  stats: {
    damage?: string;
    defense?: number;
    effects: {
      type: string;
      value: string;
    }[];
  };
  requiredLevel: number;
  value: number;
  ownerId?: string | null;
  previousOwnerId?: string | null;
  isBaseItem?: boolean;
  description?: string;
}

export interface ItemEffect {
  type: string;
  value: string;
}

export type RaceType =
  | "human"
  | "dwarf"
  | "elf"
  | "halfling"
  | "dragonborn"
  | "tiefling";

export type ClassType =
  | "Barbarian"
  | "Bard"
  | "Cleric"
  | "Druid"
  | "Fighter"
  | "Monk"
  | "Paladin"
  | "Ranger"
  | "Rogue"
  | "Sorcerer"
  | "Warlock"
  | "Wizard";

export type ArmorType =
  | "light-armor"
  | "medium-armor"
  | "heavy-armor"
  | "shield";

export type WeaponType =
  | "simple-melee"
  | "simple-ranged"
  | "martial-melee"
  | "martial-ranged"
  | "finesse"
  | "magical";

export type ItemType = "weapon" | ArmorType | "accessory" | "consumable";

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type StatType =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export interface ItemStats {
  damage?: string;
  defense?: number;
  effects: ItemEffect[];
}

export type GenerationItem = Omit<Item, "_id">;

export interface MarketItem extends Item {
  canEquip: boolean;
  restrictionReason?: string;
}

export type MarketType = "normal" | "secret" | "black";

export interface ValidatedGenerationItem extends GenerationItem {
  canEquip: boolean;
  restrictionReason?: string;
}
