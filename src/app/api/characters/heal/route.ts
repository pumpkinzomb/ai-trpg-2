import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Character } from "@/app/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { characterId, healingCost } = await req.json();

    if (!characterId || !healingCost) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the character and verify ownership
    const character = await Character.findOne({
      _id: new Types.ObjectId(characterId),
      userId: new Types.ObjectId(session.user.id),
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify the character has enough gold
    if (character.gold < healingCost) {
      return NextResponse.json(
        { error: "Insufficient gold for healing" },
        { status: 400 }
      );
    }

    // Check if healing is needed
    if (
      character.hp.current === character.hp.max &&
      character.resource.current === character.resource.max
    ) {
      return NextResponse.json(
        { error: "Character is already at full health and resources" },
        { status: 400 }
      );
    }

    // Update character's HP, resource, and gold
    const updatedCharacter = await Character.findByIdAndUpdate(
      characterId,
      {
        $set: {
          "hp.current": character.hp.max,
          "resource.current": character.resource.max,
          gold: character.gold - healingCost,
        },
      },
      { new: true }
    ).populate("equipment.weapon equipment.armor equipment.shield inventory");

    if (!updatedCharacter) {
      return NextResponse.json(
        { error: "Failed to update character" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("POST Heal Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
