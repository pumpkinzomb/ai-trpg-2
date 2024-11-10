import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import { Item, Character } from "@/app/models";
import { Types } from "mongoose";
import { MarketType, Item as IItem, ItemRarity, ItemType } from "@/app/types";
import { MARKET_TYPE_MULTIPLIERS } from "@/app/utils/item";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateFantasyItems(playerLevel: number, count: number) {
  const prompt = `
  Create ${count} unique fantasy RPG items as JSON array. Each item must strictly follow this TypeScript interface and D&D 5e rules:

  interface Item {
    name: string;
    type: "weapon" | "light-armor" | "medium-armor" | "heavy-armor" | "shield" | "accessory";
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    stats: {
      damage?: string;    // For weapons only, using D&D dice notation (e.g., "1d8", "2d6")
      defense?: number;   // For armor and shields only, following D&D AC rules
      effects: {
        type: string;     // Effect type
        value: string;    // Effect value using D&D notation
      }[];
    };
    requiredLevel: number;
    description: string;
    value: number;       // Base gold value
  }

  Requirements:
  - Level requirement should be around ${playerLevel}
  - Value should be balanced for level (100-500 × level × rarity multiplier)
  - Rarity multipliers: common(1x), uncommon(2x), rare(3x), epic(5x), legendary(10x)
  
  Equipment balance:
  - Weapons: Follow D&D weapon damage dice (1d4 to 2d6) with optional bonuses (+1 to +3 based on rarity)
  - Armor defense by type (based on D&D AC): 
    * Light: 11-12 base AC
    * Medium: 13-15 base AC
    * Heavy: 14-18 base AC
  - Shields: +2 base defense (AC)
  
  Valid effect types and formats (D&D 5e style):
  Weapon effects:
  - "Attack Bonus": "+1" to "+3"
  - "Damage Bonus": "+1" to "+3"
  - "Critical Range": "19-20" or "18-20"
  - "Additional Damage": "1d4 fire" or "1d6 lightning"
  
  Armor/Shield effects:
  - "Saving Throw Bonus": "+1" to "+3"
  - "Magic Resistance": "advantage"
  - "Damage Resistance": "slashing" or "piercing" or "bludgeoning"
  
  Accessory effects:
  - "Ability Score": "+1 STR" or "+2 DEX" (max +2)
  - "Skill Bonus": "+1 Athletics" or "+2 Stealth"
  - "Initiative": "+1" to "+3"
  - "Speed": "+5" or "+10" (in feet)
  - "Save DC": "+1" to "+2"

  Return ONLY the JSON array with no additional text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const rawItems = JSON.parse(response.choices[0].message.content || "[]");

    console.log("check rawItems", rawItems);

    const validatedItems = await Promise.all(
      rawItems.items.map(async (rawItem: any) => {
        try {
          // 기본적인 필드 존재 여부 확인
          if (
            !rawItem.name ||
            !rawItem.type ||
            !rawItem.rarity ||
            !rawItem.stats ||
            !rawItem.requiredLevel
          ) {
            console.error("Missing required fields:", rawItem);
            return null;
          }

          // type 필드 유효성 검사
          const validTypes: ItemType[] = [
            "weapon",
            "light-armor",
            "medium-armor",
            "heavy-armor",
            "shield",
            "accessory",
          ];
          if (!validTypes.includes(rawItem.type)) {
            console.error("Invalid item type:", rawItem.type);
            return null;
          }

          // rarity 필드 유효성 검사
          const validRarities: ItemRarity[] = [
            "common",
            "uncommon",
            "rare",
            "epic",
            "legendary",
          ];
          if (!validRarities.includes(rawItem.rarity)) {
            console.error("Invalid rarity:", rawItem.rarity);
            return null;
          }

          const rarityMultipliers: Record<ItemRarity, number> = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 5,
            legendary: 10,
          };

          const baseValue = 100 + Math.floor(Math.random() * 400);
          const itemRarity = rawItem.rarity as ItemRarity;
          rawItem.value =
            baseValue * rawItem.requiredLevel * rarityMultipliers[itemRarity];

          // DB에 저장
          const newItem = await Item.create(rawItem);
          return newItem;
        } catch (error) {
          console.error("Item validation/creation error:", error);
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
  count: number
): Promise<IItem[]> {
  try {
    const baseItems = await Item.find({ isBaseItem: true });
    const baseItemIds = baseItems.map((item) => item._id.toString());

    const availableItems = await Item.aggregate([
      {
        $match: {
          _id: { $nin: baseItemIds },
          ownerId: { $exists: false },
          type: { $ne: "consumable" },
          requiredLevel: { $lte: playerLevel + 3 },
        },
      },
      { $sample: { size: count } },
    ]);

    if (availableItems.length < count) {
      const additionalCount = count - availableItems.length;
      const generatedItems = await generateFantasyItems(
        playerLevel,
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
    const marketType = searchParams.get("marketType") as MarketType;
    const playerLevel = parseInt(searchParams.get("level") || "1");

    let items: IItem[] = [];
    const itemCounts = {
      secret: 3,
      normal: 6,
      black: 4,
    };

    // 마켓 타입별 아이템 로직
    switch (marketType) {
      case "secret":
        items = await generateFantasyItems(playerLevel, itemCounts.secret);
        break;

      case "black":
        items = await getBlackMarketItems(playerLevel, itemCounts.black);
        break;

      case "normal":
      default:
        items = await Item.find({ isBaseItem: true }).lean<IItem[]>();
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

    if (character.gold < item.value) {
      return NextResponse.json({ error: "Not enough gold" }, { status: 400 });
    }

    // 캐릭터 레벨 체크
    if (character.level < item.requiredLevel) {
      return NextResponse.json({ error: "Level too low" }, { status: 400 });
    }

    // 기본 아이템이 아닌 경우만 소유자 정보 업데이트
    if (!item.isBaseItem) {
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

    const [character, item] = await Promise.all([
      Character.findById(characterId).populate(
        "equipment.weapon equipment.armor equipment.shield equipment.accessories"
      ),
      Item.findById(itemId),
    ]);

    if (!character || !item) {
      return NextResponse.json(
        { error: "Character or Item not found" },
        { status: 404 }
      );
    }

    if (!character.inventory.includes(item._id)) {
      return NextResponse.json(
        { error: "Item not in inventory" },
        { status: 400 }
      );
    }

    // equipment 객체의 모든 값을 배열로 변환하여 체크
    const isEquipped = [
      character.equipment.weapon,
      character.equipment.armor,
      character.equipment.shield,
      ...(character.equipment.accessories || []),
    ].some((equip) => equip && equip._id?.toString() === item._id.toString());

    if (isEquipped) {
      return NextResponse.json(
        { error: "Cannot sell equipped items" },
        { status: 400 }
      );
    }

    const sellPrice = Math.floor(item.value * 0.6);

    if (!item.isBaseItem) {
      item.previousOwnerId = item.ownerId;
      item.ownerId = null;
      await item.save();
    }

    // inventory는 ObjectId[] 타입임을 명시
    character.inventory = character.inventory.filter(
      (invItem: Types.ObjectId) => invItem.toString() !== itemId
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
