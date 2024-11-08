import { z } from "zod";
import { Item, ItemRarity, MarketType, GenerationItem } from "../types";

// 아이템 스키마 정의
const ItemEffectSchema = z.object({
  type: z.enum([
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ] as const),
  value: z.string(),
});

const ItemStatsSchema = z.object({
  damage: z.string().optional(),
  defense: z.number().optional(),
  effects: z.array(ItemEffectSchema),
});

const ItemSchema = z.object({
  name: z.string().min(1, "아이템 이름은 필수입니다"),
  type: z.enum([
    "weapon",
    "light-armor",
    "medium-armor",
    "heavy-armor",
    "shield",
    "accessory",
    "consumable",
  ] as const),
  weaponType: z
    .enum([
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
      "finesse",
      "magical",
    ] as const)
    .optional(),
  rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"] as const),
  stats: ItemStatsSchema,
  requiredLevel: z.number().min(1).max(20),
  value: z.number().min(0),
  description: z.string(),
});

// 아이템 유효성 검사 함수
export function validateItem(item: Item): {
  isValid: boolean;
  item?: GenerationItem;
  error?: string;
} {
  try {
    // 기본 스키마 검증
    const validatedItem = ItemSchema.parse(item);

    // 1. 무기 타입 체크
    if (validatedItem.type === "weapon" && !validatedItem.weaponType) {
      return {
        isValid: false,
        error: "무기 아이템에는 weaponType이 필요합니다",
      };
    }

    // 2. 데미지/방어력 체크
    if (validatedItem.type === "weapon" && !validatedItem.stats.damage) {
      return {
        isValid: false,
        error: "무기 아이템에는 데미지 스탯이 필요합니다",
      };
    }

    if (validatedItem.type.includes("armor") && !validatedItem.stats.defense) {
      return {
        isValid: false,
        error: "방어구 아이템에는 방어력 스탯이 필요합니다",
      };
    }

    // 3. 데미지 다이스 포맷 검증
    if (validatedItem.stats.damage) {
      const dicePattern = /^\d+d\d+$/;
      if (!dicePattern.test(validatedItem.stats.damage)) {
        return {
          isValid: false,
          error: "데미지는 NdM 형식이어야 합니다 (예: 1d6)",
        };
      }
    }

    return {
      isValid: true,
      item: validatedItem,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0].message,
      };
    }
    return {
      isValid: false,
      error: "알 수 없는 유효성 검사 오류",
    };
  }
}

export function validateGeneratedItems(items: any[]): GenerationItem[] {
  return items
    .map((item) => {
      // 스키마 유효성 검사
      const validation = validateItem(item);
      if (!validation.isValid) {
        console.error(`Item validation failed: ${validation.error}`, item);
        return null;
      }

      return validation.item;
    })
    .filter((item): item is GenerationItem => item !== null);
}

export function validateGeneratedItem(item: any): {
  isValid: boolean;
  item?: GenerationItem;
  error?: string;
} {
  try {
    // 스키마 유효성 검사
    const validatedItem = ItemSchema.parse(item);
    return {
      isValid: true,
      item: validatedItem,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0].message,
      };
    }
    return {
      isValid: false,
      error: "알 수 없는 유효성 검사 오류",
    };
  }
}

export const EQUIPMENT_RESTRICTIONS = {
  Barbarian: {
    weapons: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    armor: ["light-armor", "medium-armor"],
    accessories: true,
    shields: true,
  },
  Bard: {
    weapons: ["simple-melee", "simple-ranged", "finesse", "magical"],
    armor: ["light-armor", "medium-armor"],
    accessories: true,
    shields: false,
  },
  Cleric: {
    weapons: ["simple-melee", "simple-ranged", "magical"],
    armor: ["light-armor", "medium-armor", "heavy-armor"],
    accessories: true,
    shields: true,
  },
  Druid: {
    weapons: ["simple-melee", "simple-ranged", "magical"],
    armor: ["light-armor", "medium-armor"],
    accessories: true,
    shields: true,
  },
  Fighter: {
    weapons: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
      "finesse",
    ],
    armor: ["light-armor", "medium-armor", "heavy-armor"],
    accessories: true,
    shields: true,
  },
  Monk: {
    weapons: ["simple-melee", "simple-ranged", "finesse"],
    armor: ["light-armor"],
    accessories: true,
    shields: false,
  },
  Paladin: {
    weapons: [
      "simple-melee",
      "simple-ranged",
      "martial-melee",
      "martial-ranged",
    ],
    armor: ["light-armor", "medium-armor", "heavy-armor"],
    accessories: true,
    shields: true,
  },
  Ranger: {
    weapons: ["simple-melee", "simple-ranged", "martial-ranged", "finesse"],
    armor: ["light-armor", "medium-armor"],
    accessories: true,
    shields: true,
  },
  Rogue: {
    weapons: ["simple-melee", "finesse"],
    armor: ["light-armor"],
    accessories: true,
    shields: false,
  },
  Sorcerer: {
    weapons: ["simple-melee", "simple-ranged", "magical"],
    armor: ["light-armor"],
    accessories: true,
    shields: false,
  },
  Warlock: {
    weapons: ["simple-melee", "simple-ranged", "magical"],
    armor: ["light-armor"],
    accessories: true,
    shields: false,
  },
  Wizard: {
    weapons: ["simple-melee", "magical"],
    armor: ["light-armor"],
    accessories: true,
    shields: false,
  },
} as const;

export const STATS_MODIFIERS: Record<ItemRarity, { min: number; max: number }> =
  {
    common: { min: 1, max: 2 },
    uncommon: { min: 2, max: 3 },
    rare: { min: 3, max: 4 },
    epic: { min: 4, max: 5 },
    legendary: { min: 5, max: 6 },
  };

export const ITEM_BASE_VALUES: Record<
  ItemRarity,
  { min: number; max: number }
> = {
  common: { min: 50, max: 200 },
  uncommon: { min: 200, max: 1000 },
  rare: { min: 1000, max: 5000 },
  epic: { min: 5000, max: 20000 },
  legendary: { min: 20000, max: 50000 },
};

export const MARKET_TYPE_MULTIPLIERS: Record<
  MarketType,
  { min: number; max: number }
> = {
  normal: { min: 1, max: 1 },
  black: { min: 1.5, max: 2 },
  secret: { min: 2.5, max: 4 },
};
