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
  proficiencies: string[]; // ["athletics", "stealth", "light-armor"] 등
  hp: {
    current: number;
    max: number;
    hitDice: string;
  };
  spells: {
    // 스펠 시스템 단순화
    known: string[]; // 스펠 ID 목록
    slots: {
      level: number;
      total: number;
      used: number;
    }[];
  };
  features: {
    // 직업/종족 특성 단순화
    name: string;
    type: "passive" | "active";
    effect: string; // "damage:+2", "advantage:stealth" 등 단순한 형태로
  }[];
  equipment: {
    weapon: Types.ObjectId | null;
    armor: Types.ObjectId | null;
    shield: Types.ObjectId | null;
    accessories: Types.ObjectId[];
  };
  inventory: Types.ObjectId[];
  gold: number;
  arenaStats: {
    // 투기장 정보를 캐릭터 내부에 포함
    rank: number;
    rating: number;
    wins: number;
    losses: number;
  };
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
  type: "weapon" | "armor" | "shield" | "accessory" | "consumable";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  stats: {
    damage?: string; // "1d8+1" 같은 형식으로
    defense?: number;
    effects: {
      type: string; // "advantage", "damage", "skill" 등
      value: string; // "+2", "stealth", "2d6" 등
    }[];
  };
  requiredLevel: number;
  value: number;
}
