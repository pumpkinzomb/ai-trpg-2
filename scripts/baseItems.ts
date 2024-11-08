import mongoose from "mongoose";
import { Item } from "@/app/models";
import { BASE_ITEMS } from "../constants/baseItems";

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI!;

// 기본 아이템 등록 함수
export async function registerBaseItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 기존 기본 아이템 확인 및 업데이트
    for (const baseItem of BASE_ITEMS) {
      const existingItem = await Item.findOne({
        name: baseItem.name,
        type: baseItem.type,
        rarity: baseItem.rarity,
      });

      if (existingItem) {
        // 기존 아이템 업데이트
        await Item.findByIdAndUpdate(existingItem._id, {
          ...baseItem,
          updatedAt: new Date(),
        });
        console.log(`Updated base item: ${baseItem.name}`);
      } else {
        // 새 아이템 생성
        await Item.create({
          ...baseItem,
          isBaseItem: true, // 기본 아이템 표시
        });
        console.log(`Created new base item: ${baseItem.name}`);
      }
    }

    console.log("Base items registration completed");
  } catch (error) {
    console.error("Error registering base items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// 기본 아이템 제거 함수
export async function removeBaseItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. BASE_ITEMS에 있는 아이템만 제거
    for (const baseItem of BASE_ITEMS) {
      const result = await Item.deleteMany({
        name: baseItem.name,
        type: baseItem.type,
        rarity: baseItem.rarity,
        isBaseItem: true,
      });

      console.log(
        `Removed ${result.deletedCount} instances of base item: ${baseItem.name}`
      );
    }

    // 2. 모든 기본 아이템 제거 (대체 방법)
    // const result = await Item.deleteMany({ isBaseItem: true });
    // console.log(`Removed ${result.deletedCount} base items`);

    console.log("Base items removal completed");
  } catch (error) {
    console.error("Error removing base items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// 특정 기본 아이템 제거 함수 (선택적)
async function removeSpecificBaseItems(itemNames: string[]) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const result = await Item.deleteMany({
      name: { $in: itemNames },
      isBaseItem: true,
    });

    console.log(`Removed ${result.deletedCount} specified base items`);
  } catch (error) {
    console.error("Error removing specific base items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// 캐릭터가 보유한 기본 아이템 안전 제거 함수
async function safeRemoveBaseItems() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 캐릭터가 보유하지 않은 기본 아이템만 제거
    const result = await Item.deleteMany({
      isBaseItem: true,
      ownerId: null,
      previousOwnerId: null,
    });

    console.log(`Safely removed ${result.deletedCount} unused base items`);
  } catch (error) {
    console.error("Error safely removing base items:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}
