import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import { Character } from "@/app/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Types } from "mongoose";

interface Props {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Props) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const character = await Character.findOne({
      _id: new Types.ObjectId(params.id),
      userId: new Types.ObjectId(session.user.id),
    })
      .populate(
        "equipment.weapon equipment.armor equipment.shield equipment.accessories inventory"
      )
      .lean();

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("GET Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const character = await Character.findOneAndUpdate(
      {
        _id: new Types.ObjectId(params.id),
        userId: new Types.ObjectId(session.user.id),
      },
      { $set: body },
      { new: true }
    ).populate(
      "equipment.weapon equipment.armor equipment.shield equipment.accessories inventory"
    );

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error("PUT Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Props) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const character = await Character.findOneAndDelete({
      _id: new Types.ObjectId(params.id),
      userId: new Types.ObjectId(session.user.id),
    });

    if (!character) {
      return NextResponse.json(
        { error: "Character not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE Character error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
