import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { Item, Character } from "@/app/models";
import { MarketType, ClassType, Item as IItem } from "@/app/types";
import {
  EQUIPMENT_RESTRICTIONS,
  MARKET_TYPE_MULTIPLIERS,
  validateGeneratedItem,
} from "@/app/utils/item";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateFantasyItems(
  playerLevel: number,
  playerClass: ClassType,
  count: number
) {
  const restrictions = EQUIPMENT_RESTRICTIONS[playerClass];

  const prompt = `
        Create ${count} unique fantasy RPG items for D&D 5E system.
        Market Type: secret
        Player Class: ${playerClass}
        Player Level: ${playerLevel}
        
        Item Type Restrictions:
        - ONLY create equipment items (NO potions, scrolls, or consumables)
        - Focus on weapons, armor, shields, and accessories
        
        Class Restrictions:
        - Allowed Weapons: ${restrictions.weapons.join(", ")}
        - Allowed Armor: ${restrictions.armor.join(", ")}
        - Can use shields: ${restrictions.shields}
        
        Equipment Guidelines:
        - Weapons follow D&D damage dice (1d4, 1d6, 1d8, 1d10, 1d12, 2d6)
        - Armor provides base AC (Light: 11-12, Medium: 13-15, Heavy: 14-18)
        - Stats modifiers by rarity:
          * Common: +1 to +2
          * Uncommon: +2 to +3
          * Rare: +3 to +4
          * Epic: +4 to +5
          * Legendary: +5 to +6
        - Each item should include:
          * Weight (based on type and materials)
          * Durability (100 for new items)
          * Unique effects based on rarity
          * Detailed description and lore
        
        Balance Guidelines:
        - Items should be appropriate for player level (${playerLevel})
        - Focus on rare and unique magical equipment
        - Consider class-specific bonuses and restrictions
        - Equipment types must be one of: weapon, light-armor, medium-armor, heavy-armor, shield, accessory
        
        Return in strict JSON format matching the TypeScript interface shown previously.
      `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const rawItems = JSON.parse(response.choices[0].message.content || "[]");

    // 검증 전에 consumable 타입 필터링
    const filteredItems = rawItems.filter(
      (item: any) => item.type !== "consumable"
    );

    const validatedItems = await Promise.all(
      filteredItems.map(async (rawItem: any) => {
        const validation = validateGeneratedItem(rawItem);
        if (!validation.isValid || !validation.item) {
          console.error(`Item validation failed: ${validation.error}`, rawItem);
          return null;
        }

        // 한번 더 consumable 체크
        if (validation.item.type === "consumable") {
          return null;
        }

        try {
          const newItem = await Item.create(validation.item);
          return newItem;
        } catch (error) {
          console.error("Failed to save item to DB:", error);
          return null;
        }
      })
    );

    return validatedItems.filter((item): item is IItem => item !== null);
  } catch (error) {
    console.error("Error generating items:", error);
    return [];
  }
}

async function getBlackMarketItems(
  playerLevel: number,
  count: number,
  playerClass: ClassType
): Promise<IItem[]> {
  try {
    const baseItemIds = baseItems.map((item) => item._id.toString());

    const availableItems = await Item.find({
      _id: { $nin: baseItemIds },
      ownerId: { $exists: false },
      type: { $ne: "consumable" }, // consumable 타입 제외
      requiredLevel: { $lte: playerLevel + 3 },
    })
      .sort(() => Math.random() - 0.5)
      .limit(count);

    if (availableItems.length < count) {
      const additionalCount = count - availableItems.length;
      const generatedItems = await generateFantasyItems(
        playerLevel,
        playerClass,
        additionalCount
      );

      return [...availableItems, ...generatedItems];
    }

    return availableItems;
  } catch (error) {
    console.error("Error fetching black market items:", error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playerLevel = parseInt(searchParams.get("level") || "1");
    const marketType = searchParams.get("marketType") as MarketType;
    const playerClass = searchParams.get("class") as ClassType;

    if (
      !playerClass ||
      !Object.keys(EQUIPMENT_RESTRICTIONS).includes(playerClass)
    ) {
      return NextResponse.json(
        { error: "Invalid character class" },
        { status: 400 }
      );
    }

    let items: IItem[] = [];
    const itemCounts = {
      secret: 3,
      normal: 6,
      black: 4,
    };

    // 마켓 타입별 아이템 로직
    switch (marketType) {
      case "secret":
        items = await generateFantasyItems(
          playerLevel,
          playerClass,
          itemCounts.secret
        );
        break;

      case "black":
        items = await getBlackMarketItems(
          playerLevel,
          itemCounts.black,
          playerClass
        );
        break;

      case "normal":
      default:
        // 일반 시장에서는 모든 기본 아이템(소비 아이템 포함) 제공
        items = [...baseItems];
        break;
    }

    // 마켓 타입에 따라 아이템 가격 조정
    const multiplier = MARKET_TYPE_MULTIPLIERS[marketType];
    const adjustedItems = items.map((item) => ({
      ...item,
      value: Math.floor(
        item.value *
          (Math.random() * (multiplier.max - multiplier.min) + multiplier.min)
      ),
    }));

    return NextResponse.json({
      marketType,
      items: adjustedItems,
    });
  } catch (error) {
    console.error("Market generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate market" },
      { status: 500 }
    );
  }
}

// 아이템 구매
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { characterId, itemId } = body;

    const [character, item] = await Promise.all([
      Character.findById(characterId),
      Item.findById(itemId),
    ]);

    if (!character || !item) {
      return NextResponse.json(
        { error: "Character or Item not found" },
        { status: 404 }
      );
    }

    // 골드만 확인
    if (character.gold < item.value) {
      return NextResponse.json({ error: "Not enough gold" }, { status: 400 });
    }

    // AI 생성 아이템인 경우 소유자 정보 업데이트
    if (
      !baseItems.some(
        (baseItem) => baseItem._id.toString() === item._id.toString()
      )
    ) {
      item.ownerId = character._id;
      await item.save();
    }

    // 캐릭터 골드 차감 및 인벤토리 업데이트
    character.gold -= item.value;
    character.inventory.push(item._id);
    await character.save();

    return NextResponse.json({
      success: true,
      item,
      remainingGold: character.gold,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json(
      { error: "Failed to purchase item" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { characterId, itemId } = body;

    // 캐릭터와 아이템 확인
    const [character, item] = await Promise.all([
      Character.findById(characterId),
      Item.findById(itemId),
    ]);

    if (!character || !item) {
      return NextResponse.json(
        { error: "Character or Item not found" },
        { status: 404 }
      );
    }

    // 아이템이 인벤토리에 있는지 확인
    if (!character.inventory.includes(item._id)) {
      return NextResponse.json(
        { error: "Item not in inventory" },
        { status: 400 }
      );
    }

    // 장착된 아이템 판매 방지
    const isEquipped = Object.values(character.equipment).some(
      (equip) => equip?._id?.toString() === item._id.toString()
    );
    if (isEquipped) {
      return NextResponse.json(
        { error: "Cannot sell equipped items" },
        { status: 400 }
      );
    }

    // 판매 가격 계산 (아이템 기본 가격의 60%)
    const sellPrice = Math.floor(item.value * 0.6);

    // AI 생성 아이템인 경우 소유자 정보 업데이트
    if (
      !baseItems.some(
        (baseItem) => baseItem._id.toString() === item._id.toString()
      )
    ) {
      item.previousOwnerId = item.ownerId;
      item.ownerId = null;
      await item.save();
    }

    // 캐릭터 인벤토리에서 제거하고 골드 지급
    character.inventory = character.inventory.filter(
      (invItem) => invItem.toString() !== itemId
    );
    character.gold += sellPrice;
    await character.save();

    return NextResponse.json({
      success: true,
      soldPrice: sellPrice,
      newGold: character.gold,
    });
  } catch (error) {
    console.error("Sell error:", error);
    return NextResponse.json({ error: "Failed to sell item" }, { status: 500 });
  }
}
