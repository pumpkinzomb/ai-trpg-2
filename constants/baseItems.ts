import { Item } from "@/app/types";

export const BASE_ITEMS: Omit<
  Item,
  "_id" | "isBaseItem" | "ownerId" | "previousOwnerId"
>[] = [
  // 무기류
  {
    name: "낡은 단검",
    type: "weapon",
    rarity: "common",
    stats: {
      damage: "1d4",
      effects: [],
    },
    requiredLevel: 1,
    value: 20,
  },
  {
    name: "마법사의 지팡이",
    type: "weapon",
    rarity: "uncommon",
    stats: {
      damage: "1d6",
      effects: [
        {
          type: "intelligence_bonus",
          value: "+1",
        },
        {
          type: "spell_damage_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 3,
    value: 250,
  },
  {
    name: "민첩한 단궁",
    type: "weapon",
    rarity: "uncommon",
    stats: {
      damage: "1d8",
      effects: [
        {
          type: "dexterity_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 3,
    value: 200,
  },
  {
    name: "대사제의 철퇴",
    type: "weapon",
    rarity: "rare",
    stats: {
      damage: "1d8",
      effects: [
        {
          type: "wisdom_bonus",
          value: "+2",
        },
        {
          type: "healing_bonus",
          value: "+2",
        },
      ],
    },
    requiredLevel: 5,
    value: 400,
  },
  {
    name: "영웅의 대검",
    type: "weapon",
    rarity: "rare",
    stats: {
      damage: "2d6",
      effects: [
        {
          type: "strength_bonus",
          value: "+2",
        },
      ],
    },
    requiredLevel: 5,
    value: 450,
  },

  // 방어구류
  {
    name: "수호자의 판금갑옷",
    type: "heavy-armor",
    rarity: "rare",
    stats: {
      defense: 16,
      effects: [
        {
          type: "hp_max_bonus",
          value: "+10",
        },
        {
          type: "constitution_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 5,
    value: 500,
  },
  {
    name: "도적의 가죽갑옷",
    type: "light-armor",
    rarity: "uncommon",
    stats: {
      defense: 12,
      effects: [
        {
          type: "dexterity_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 3,
    value: 300,
  },
  {
    name: "마법 방패",
    type: "shield",
    rarity: "rare",
    stats: {
      defense: 2,
      effects: [
        {
          type: "spell_save_dc_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 5,
    value: 400,
  },

  // 악세서리류
  {
    name: "지혜의 목걸이",
    type: "accessory",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "wisdom_bonus",
          value: "+1",
        },
        {
          type: "spell_slots_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 3,
    value: 300,
  },
  {
    name: "귀족의 인장 반지",
    type: "accessory",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "charisma_bonus",
          value: "+2",
        },
      ],
    },
    requiredLevel: 3,
    value: 250,
  },
  {
    name: "싸움꾼의 팔찌",
    type: "accessory",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "strength_bonus",
          value: "+1",
        },
        {
          type: "resource_max_bonus",
          value: "+2",
        },
      ],
    },
    requiredLevel: 3,
    value: 275,
  },
  {
    name: "현자의 머리띠",
    type: "accessory",
    rarity: "rare",
    stats: {
      effects: [
        {
          type: "intelligence_bonus",
          value: "+2",
        },
        {
          type: "spell_slots_bonus",
          value: "+1",
        },
      ],
    },
    requiredLevel: 5,
    value: 450,
  },
  {
    name: "생명력의 목걸이",
    type: "accessory",
    rarity: "rare",
    stats: {
      effects: [
        {
          type: "constitution_bonus",
          value: "+2",
        },
        {
          type: "hp_max_bonus",
          value: "+15",
        },
      ],
    },
    requiredLevel: 5,
    value: 500,
  },
  {
    name: "수호자의 반지",
    type: "accessory",
    rarity: "epic",
    stats: {
      effects: [
        {
          type: "all_saves_bonus",
          value: "+1",
        },
        {
          type: "hp_max_bonus",
          value: "+20",
        },
      ],
    },
    requiredLevel: 10,
    value: 1000,
  },

  // 소비 아이템류
  {
    name: "하급 치유 물약",
    type: "consumable",
    rarity: "common",
    stats: {
      effects: [
        {
          type: "heal",
          value: "2d4+2",
        },
      ],
    },
    requiredLevel: 1,
    value: 25,
  },
  {
    name: "상급 치유 물약",
    type: "consumable",
    rarity: "rare",
    stats: {
      effects: [
        {
          type: "heal",
          value: "8d4+8",
        },
      ],
    },
    requiredLevel: 10,
    value: 150,
  },
  {
    name: "전투의 물약",
    type: "consumable",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "restore_resource",
          value: "25",
        },
        {
          type: "strength_boost",
          value: "+2",
        },
      ],
    },
    requiredLevel: 5,
    value: 100,
  },
  {
    name: "현자의 물약",
    type: "consumable",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "restore_spell_slot",
          value: "1",
        },
      ],
    },
    requiredLevel: 5,
    value: 120,
  },
  {
    name: "영웅의 물약",
    type: "consumable",
    rarity: "rare",
    stats: {
      effects: [
        {
          type: "all_stats_boost",
          value: "+2",
        },
        {
          type: "heal",
          value: "4d4+4",
        },
      ],
    },
    requiredLevel: 8,
    value: 200,
  },
  {
    name: "신속의 물약",
    type: "consumable",
    rarity: "uncommon",
    stats: {
      effects: [
        {
          type: "dexterity_boost",
          value: "+4",
        },
      ],
    },
    requiredLevel: 5,
    value: 100,
  },
];
