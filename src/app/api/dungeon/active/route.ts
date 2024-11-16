import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Character, Dungeon } from "@/app/models";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const characterId = searchParams.get("characterId");

    if (!characterId) {
      return NextResponse.json(
        { error: "Character ID is required" },
        { status: 400 }
      );
    }

    // 캐릭터 확인
    const [character, activeDungeon] = await Promise.all([
      Character.findById(characterId)
        .select("-spells -arenaStats -proficiencies")
        .populate([
          "inventory",
          "equipment.weapon",
          "equipment.armor",
          "equipment.shield",
          "equipment.accessories",
        ]),
      Dungeon.findOne({
        characterId,
        active: true,
      }),
    ]);

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dungeon: activeDungeon
        ? {
            ...activeDungeon.toObject(),
            character,
          }
        : null,
    });
  } catch (error) {
    console.error("Active dungeon check error:", error);
    return NextResponse.json(
      { error: "Failed to check active dungeon" },
      { status: 500 }
    );
  }
}
