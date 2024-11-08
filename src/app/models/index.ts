import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  image: string;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Character Schema
const characterSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    level: { type: Number, required: true, default: 1 },
    experience: { type: Number, required: true, default: 0 },
    class: { type: String, required: true },
    race: { type: String, required: true },
    stats: {
      strength: { type: Number, required: true },
      dexterity: { type: Number, required: true },
      constitution: { type: Number, required: true },
      intelligence: { type: Number, required: true },
      wisdom: { type: Number, required: true },
      charisma: { type: Number, required: true },
    },
    proficiencies: [{ type: String }],
    hp: {
      current: { type: Number, required: true },
      max: { type: Number, required: true },
      hitDice: { type: String, required: true },
    },
    spells: {
      known: [{ type: Schema.Types.ObjectId, ref: "Spell" }],
      slots: [
        {
          level: { type: Number, required: true },
          total: { type: Number, required: true },
          used: { type: Number, required: true, default: 0 },
        },
      ],
    },
    features: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ["passive", "active"], required: true },
        effect: { type: String, required: true },
      },
    ],
    equipment: {
      weapon: { type: Schema.Types.ObjectId, ref: "Item", default: null },
      armor: { type: Schema.Types.ObjectId, ref: "Item", default: null },
      shield: { type: Schema.Types.ObjectId, ref: "Item", default: null },
      accessories: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    },
    inventory: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    gold: { type: Number, required: true, default: 0 },
    arenaStats: {
      rank: { type: Number, required: true, default: 0 },
      rating: { type: Number, required: true, default: 1000 },
      wins: { type: Number, required: true, default: 0 },
      losses: { type: Number, required: true, default: 0 },
    },
    resource: {
      current: { type: Number, required: true },
      max: { type: Number, required: true },
      name: { type: String, required: true },
    },
    profileImage: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Spell Schema
const spellSchema = new Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true },
    school: { type: String, required: true },
    castingTime: { type: String, required: true },
    range: { type: String, required: true },
    effect: {
      type: { type: String, required: true },
      dice: { type: String },
      bonus: { type: Number },
    },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Combat Schema
const combatSchema = new Schema(
  {
    characterId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Character",
    },
    type: { type: String, enum: ["pve", "pvp"], required: true },
    opponent: {
      id: { type: Schema.Types.ObjectId, ref: "Character" },
      name: { type: String, required: true },
      stats: { type: Schema.Types.Mixed, required: true },
    },
    rounds: [
      {
        attacker: { type: String, required: true },
        action: { type: String, required: true },
        rolls: [
          {
            type: { type: String, required: true },
            dice: { type: String, required: true },
            result: { type: Number, required: true },
            advantage: { type: Boolean },
          },
        ],
        damage: { type: Number },
        effects: [{ type: String }],
      },
    ],
    result: { type: String, enum: ["victory", "defeat"], required: true },
    rewards: {
      experience: { type: Number },
      gold: { type: Number },
      items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    },
  },
  {
    timestamps: true,
  }
);

// Item Schema
const itemSchema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "weapon",
        "light-armor",
        "medium-armor",
        "heavy-armor",
        "shield",
        "accessory",
        "consumable",
      ],
      required: true,
    },
    rarity: {
      type: String,
      enum: ["common", "uncommon", "rare", "epic", "legendary"],
      required: true,
    },
    stats: {
      damage: { type: String },
      defense: { type: Number },
      effects: [
        {
          type: { type: String, required: true },
          value: { type: String, required: true },
        },
      ],
    },
    requiredLevel: { type: Number, required: true },
    description: { type: String, default: "" },
    value: { type: Number, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "Character", default: null },
    previousOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "Character",
      default: null,
    },
    isBaseItem: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Interfaces for TypeScript
export interface ICharacter extends Document {
  userId: mongoose.Types.ObjectId;
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
  proficiencies: string[];
  hp: {
    current: number;
    max: number;
    hitDice: string;
  };
  spells: {
    known: mongoose.Types.ObjectId[];
    slots: {
      level: number;
      total: number;
      used: number;
    }[];
  };
  features: {
    name: string;
    type: "passive" | "active";
    effect: string;
  }[];
  resource: {
    current: number;
    max: number;
    name: string;
  };
  equipment: {
    weapon: mongoose.Types.ObjectId | null;
    armor: mongoose.Types.ObjectId | null;
    shield: mongoose.Types.ObjectId | null;
    accessories: mongoose.Types.ObjectId[];
  };
  inventory: mongoose.Types.ObjectId[];
  gold: number;
  arenaStats: {
    rank: number;
    rating: number;
    wins: number;
    losses: number;
  };
  profileImage: string;
}

interface ISpell extends Document {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  effect: {
    type: string;
    dice?: string;
    bonus?: number;
  };
  description: string;
}

interface ICombat extends Document {
  characterId: mongoose.Types.ObjectId;
  type: "pve" | "pvp";
  opponent: {
    id?: mongoose.Types.ObjectId;
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
    items: mongoose.Types.ObjectId[];
  };
}

interface IItem extends Document {
  name: string;
  type:
    | "weapon"
    | "light-armor"
    | "medium-armor"
    | "heavy-armor"
    | "shield"
    | "accessory"
    | "consumable";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  stats: {
    damage?: string;
    defense?: number;
    effects: {
      type: string;
      value: string;
    }[];
  };
  requiredLevel: number;
  value: number;
  ownerId: string | null;
  previousOwnerId: string | null;
  isBaseItem: boolean;
  description: string;
}

// Models
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export const Character =
  mongoose.models.Character ||
  mongoose.model<ICharacter>("Character", characterSchema);
export const Spell =
  mongoose.models.Spell || mongoose.model<ISpell>("Spell", spellSchema);
export const Combat =
  mongoose.models.Combat || mongoose.model<ICombat>("Combat", combatSchema);
export const Item =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemSchema);
