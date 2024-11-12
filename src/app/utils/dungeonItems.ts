import { ClientSession } from "mongoose";
import { Dungeon, IDungeonState, Character, ICharacter, Item } from "../models";

export async function handleDungeonItems(
  dungeon: IDungeonState,
  character: ICharacter,
  status: "complete" | "fail" | "escape",
  session: ClientSession,
  savedItems?: { itemId: string }[]
) {
  const tempItemIds = dungeon.temporaryInventory.map((item) =>
    item._id.toString()
  );

  if (status === "complete") {
    // 성공 시: 임시 인벤토리만 비우기
    await Dungeon.findByIdAndUpdate(
      dungeon._id,
      {
        $set: { temporaryInventory: [] },
      },
      { session }
    );
  } else if (status === "fail") {
    // 실패 시: 모든 아이템 제거
    await Promise.all([
      Character.findByIdAndUpdate(
        character._id,
        {
          $pull: { inventory: { _id: { $in: tempItemIds } } },
        },
        { session }
      ),
      Item.deleteMany({ _id: { $in: tempItemIds } }, { session }),
      Dungeon.findByIdAndUpdate(
        dungeon._id,
        {
          $set: { temporaryInventory: [] },
        },
        { session }
      ),
    ]);
  } else if (status === "escape") {
    const savedItemIds =
      savedItems?.map((item) => item.itemId.toString()) || [];
    const itemsToRemove = tempItemIds.filter(
      (id) => !savedItemIds.includes(id)
    );

    await Promise.all([
      Character.findByIdAndUpdate(
        character._id,
        {
          $pull: { inventory: { _id: { $in: itemsToRemove } } },
        },
        { session }
      ),
      Item.deleteMany({ _id: { $in: itemsToRemove } }, { session }),
      Dungeon.findByIdAndUpdate(
        dungeon._id,
        {
          $set: { temporaryInventory: [] },
        },
        { session }
      ),
    ]);
  }
}
