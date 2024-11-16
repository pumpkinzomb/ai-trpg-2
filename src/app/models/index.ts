import mongoose, { Schema, Document } from "mongoose";
import { DungeonLog } from "../types";
import { timeStamp } from "console";

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
        "misc",
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

const characterStatusSchema = new mongoose.Schema<ICharacterStatus>({
  characterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Character",
    required: true,
  },
  status: {
    dungeon: {
      isActive: { type: Boolean, default: false },
      dungeonId: { type: String },
      startTime: { type: Date },
      endTime: { type: Date },
    },
    labor: {
      isActive: { type: Boolean, default: false },
      startTime: { type: Date },
      endTime: { type: Date },
      reward: { type: Number },
    },
  },
  lastUpdated: { type: Date, default: Date.now },
});

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

export interface ICharacterStatus {
  characterId: mongoose.Types.ObjectId;
  status: {
    dungeon: {
      isActive: boolean;
      dungeonId?: string;
      startTime?: Date;
      endTime?: Date;
    };
    labor: {
      isActive: boolean;
      startTime?: Date;
      endTime?: Date;
      reward?: number;
    };
  };
  lastUpdated: Date;
}

const dungeonSchema = new Schema(
  {
    characterId: {
      type: Schema.Types.ObjectId,
      ref: "Character",
      required: true,
    },
    dungeonName: {
      type: String,
      required: true,
    },
    concept: {
      type: String,
      required: true,
    },
    currentStage: {
      type: Number,
      required: true,
      default: 0,
    },
    maxStages: {
      type: Number,
      required: true,
    },
    canEscape: {
      type: Boolean,
      required: true,
      default: true,
    },
    playerHP: {
      type: Number,
      required: true,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    temporaryInventory: {
      type: [
        {
          itemId: {
            type: Schema.Types.ObjectId,
            ref: "Item",
            required: true,
          },
          logId: {
            type: Schema.Types.ObjectId,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    logs: [
      {
        type: {
          type: String,
          enum: ["combat", "trap", "treasure", "story", "rest"],
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
        image: String,
        data: {
          enemies: [
            {
              name: String,
              level: Number,
              hp: Number,
              ac: Number,
              attacks: [
                {
                  name: String,
                  damage: String,
                  toHit: Number,
                },
              ],
            },
          ],
          trap: {
            type: {
              type: String,
              enum: [
                "dexterity",
                "strength",
                "constitution",
                "intelligence",
                "wisdom",
              ],
            },
            dc: Number,
            outcomes: {
              success: {
                description: String,
              },
              failure: {
                description: String,
              },
            },
            resolved: Boolean,
            resolution: {
              success: Boolean,
              roll: Number,
              damage: Number,
              description: String,
            },
          },
          combat: {
            resolved: Boolean,
            resolution: {
              victory: Boolean,
              remainingHp: Number,
              usedItems: [
                {
                  itemId: String,
                  name: String,
                  effect: {
                    type: String,
                    value: String,
                  },
                  timeStamp: Date,
                },
              ],
              experienceGained: Number,
              experienceBreakdown: {
                baseXP: Number,
                bonusXP: Number,
                total: Number,
              },
            },
          },
          rewards: {
            goldLooted: {
              type: Boolean,
              default: false,
            },
            gold: Number,
            xp: Number,
            items: [Schema.Types.Mixed],
          },
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    rewards: {
      xp: Number,
      gold: Number,
    },
  },
  {
    timestamps: true,
  }
);

export interface IDungeonState extends Document {
  characterId: string;
  dungeonName: string;
  concept: string;
  currentStage: number;
  maxStages: number;
  canEscape: boolean;
  playerHP: number;
  active: boolean;
  logs: DungeonLog[];
  createdAt: Date;
  updatedAt: Date;
  temporaryInventory: mongoose.Types.ObjectId[];
  status: string;
  completedAt?: Date | null;
  rewards?: { xp: number; gold: number };
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

export interface IItem extends Document {
  name: string;
  type:
    | "weapon"
    | "light-armor"
    | "medium-armor"
    | "heavy-armor"
    | "shield"
    | "accessory"
    | "consumable"
    | "misc";
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

// 한 캐릭터당 하나의 active 던전만 허용
dungeonSchema.index(
  { characterId: 1, active: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
  }
);

// Models
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export const Character =
  mongoose.models.Character ||
  mongoose.model<ICharacter>("Character", characterSchema);
export const Spell =
  mongoose.models.Spell || mongoose.model<ISpell>("Spell", spellSchema);
export const Item =
  mongoose.models.Item || mongoose.model<IItem>("Item", itemSchema);
export const Dungeon =
  mongoose.models.Dungeon ||
  mongoose.model<IDungeonState>("Dungeon", dungeonSchema);
export const CharacterStatus =
  mongoose.models.CharacterStatus ||
  mongoose.model<ICharacterStatus>("CharacterStatus", characterStatusSchema);
