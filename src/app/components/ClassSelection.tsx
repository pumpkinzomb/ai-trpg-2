import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Wand2,
  Music,
  Leaf,
  Sun,
  Moon,
  Swords,
  Crown,
  Crosshair,
} from "lucide-react";

export const classes = [
  {
    id: "barbarian",
    name: "Barbarian",
    icon: <Swords className="w-8 h-8" />,
    description:
      "Fierce warriors who enter a battle rage, fueled by primal instincts.",
    hitDice: "d12",
    primaryAbility: "Strength",
    savingThrows: ["Strength", "Constitution"],
    features: [
      {
        name: "Rage",
        value: "Enter a powerful battle rage for enhanced combat abilities",
      },
      {
        name: "Unarmored Defense",
        value: "Gain AC bonus from Constitution when not wearing armor",
      },
      {
        name: "Reckless Attack",
        value:
          "Gain advantage on attacks at the cost of enemies having advantage against you",
      },
    ],
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      skills: 2,
      skillChoices: [
        "Animal Handling",
        "Athletics",
        "Intimidation",
        "Nature",
        "Perception",
        "Survival",
      ],
    },
  },
  {
    id: "bard",
    name: "Bard",
    icon: <Music className="w-8 h-8" />,
    description:
      "Magical entertainers whose music weaves magic and inspires allies.",
    hitDice: "d8",
    primaryAbility: "Charisma",
    savingThrows: ["Dexterity", "Charisma"],
    features: [
      { name: "Bardic Inspiration", value: "Grant inspiration dice to allies" },
      { name: "Spellcasting", value: "Cast bard spells using Charisma" },
      {
        name: "Jack of All Trades",
        value: "Add half proficiency bonus to unproficient ability checks",
      },
    ],
    proficiencies: {
      armor: ["Light"],
      weapons: [
        "Simple",
        "Hand Crossbows",
        "Longswords",
        "Rapiers",
        "Shortswords",
      ],
      tools: ["Three musical instruments of your choice"],
      skills: 3,
      skillChoices: [
        "Acrobatics",
        "Animal Handling",
        "Arcana",
        "Athletics",
        "Deception",
        "History",
        "Insight",
        "Intimidation",
        "Investigation",
        "Medicine",
        "Nature",
        "Perception",
        "Performance",
        "Persuasion",
        "Religion",
        "Sleight of Hand",
        "Stealth",
      ],
    },
  },
  {
    id: "druid",
    name: "Druid",
    icon: <Leaf className="w-8 h-8" />,
    description:
      "Priests of nature who wield natural magic and can shapeshift.",
    hitDice: "d8",
    primaryAbility: "Wisdom",
    savingThrows: ["Intelligence", "Wisdom"],
    features: [
      { name: "Druidic", value: "Speak the secret language of druids" },
      { name: "Spellcasting", value: "Cast druid spells using Wisdom" },
      { name: "Wild Shape", value: "Transform into different animal forms" },
    ],
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: [
        "Clubs",
        "Daggers",
        "Darts",
        "Javelins",
        "Maces",
        "Quarterstaffs",
        "Scimitars",
        "Sickles",
        "Slings",
        "Spears",
      ],
      tools: ["Herbalism Kit"],
      skills: 2,
      skillChoices: [
        "Arcana",
        "Animal Handling",
        "Insight",
        "Medicine",
        "Nature",
        "Perception",
        "Religion",
        "Survival",
      ],
    },
  },
  {
    id: "monk",
    name: "Monk",
    icon: <Crown className="w-8 h-8" />,
    description:
      "Masters of martial arts who harness the power of body and soul.",
    hitDice: "d8",
    primaryAbility: "Dexterity & Wisdom",
    savingThrows: ["Strength", "Dexterity"],
    features: [
      {
        name: "Unarmored Defense",
        value: "Gain AC bonus from Wisdom when not wearing armor",
      },
      {
        name: "Martial Arts",
        value: "Use Dexterity for unarmed strikes and monk weapons",
      },
      { name: "Ki", value: "Harness magical energy for special abilities" },
    ],
    proficiencies: {
      armor: [],
      weapons: ["Simple", "Shortswords"],
      tools: ["One type of artisan's tools or musical instrument"],
      skills: 2,
      skillChoices: [
        "Acrobatics",
        "Athletics",
        "History",
        "Insight",
        "Religion",
        "Stealth",
      ],
    },
  },
  {
    id: "paladin",
    name: "Paladin",
    icon: <Sun className="w-8 h-8" />,
    description:
      "Holy warriors bound by sacred oaths to uphold justice and righteousness.",
    hitDice: "d10",
    primaryAbility: "Strength & Charisma",
    savingThrows: ["Wisdom", "Charisma"],
    features: [
      { name: "Divine Sense", value: "Detect celestials, fiends, and undead" },
      {
        name: "Lay on Hands",
        value: "Pool of healing power to cure wounds and diseases",
      },
      {
        name: "Divine Smite",
        value: "Channel divine energy into powerful weapon strikes",
      },
    ],
    proficiencies: {
      armor: ["Light", "Medium", "Heavy", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      skills: 2,
      skillChoices: [
        "Athletics",
        "Insight",
        "Intimidation",
        "Medicine",
        "Persuasion",
        "Religion",
      ],
    },
  },
  {
    id: "ranger",
    name: "Ranger",
    icon: <Crosshair className="w-8 h-8" />,
    description: "Warriors of the wilderness, skilled in tracking and hunting.",
    hitDice: "d10",
    primaryAbility: "Dexterity & Wisdom",
    savingThrows: ["Strength", "Dexterity"],
    features: [
      {
        name: "Favored Enemy",
        value: "Advantage against certain types of creatures",
      },
      {
        name: "Natural Explorer",
        value: "Expert at navigating specific types of terrain",
      },
      { name: "Spellcasting", value: "Cast ranger spells using Wisdom" },
    ],
    proficiencies: {
      armor: ["Light", "Medium", "Shields"],
      weapons: ["Simple", "Martial"],
      tools: [],
      skills: 3,
      skillChoices: [
        "Animal Handling",
        "Athletics",
        "Insight",
        "Investigation",
        "Nature",
        "Perception",
        "Stealth",
        "Survival",
      ],
    },
  },
  {
    id: "sorcerer",
    name: "Sorcerer",
    icon: <Wand2 className="w-8 h-8" />,
    description:
      "Spellcasters who draw on inherent magic from a gift or bloodline.",
    hitDice: "d6",
    primaryAbility: "Charisma",
    savingThrows: ["Constitution", "Charisma"],
    features: [
      { name: "Spellcasting", value: "Cast sorcerer spells using Charisma" },
      { name: "Sorcerous Origin", value: "Choose source of magical power" },
      {
        name: "Font of Magic",
        value: "Gain sorcery points to fuel magical effects",
      },
    ],
    proficiencies: {
      armor: [],
      weapons: [
        "Daggers",
        "Darts",
        "Slings",
        "Quarterstaffs",
        "Light Crossbows",
      ],
      tools: [],
      skills: 2,
      skillChoices: [
        "Arcana",
        "Deception",
        "Insight",
        "Intimidation",
        "Persuasion",
        "Religion",
      ],
    },
  },
  {
    id: "warlock",
    name: "Warlock",
    icon: <Moon className="w-8 h-8" />,
    description: "Wielders of magic granted by an otherworldly patron.",
    hitDice: "d8",
    primaryAbility: "Charisma",
    savingThrows: ["Wisdom", "Charisma"],
    features: [
      { name: "Otherworldly Patron", value: "Form pact with powerful entity" },
      { name: "Pact Magic", value: "Cast warlock spells using Charisma" },
      { name: "Eldritch Invocations", value: "Gain supernatural abilities" },
    ],
    proficiencies: {
      armor: ["Light"],
      weapons: ["Simple"],
      tools: [],
      skills: 2,
      skillChoices: [
        "Arcana",
        "Deception",
        "History",
        "Intimidation",
        "Investigation",
        "Nature",
        "Religion",
      ],
    },
  },
];

interface ClassSelectionProps {
  onSelect?: (selectedClass: (typeof classes)[0]) => void;
}

const ClassSelection: React.FC<ClassSelectionProps> = ({ onSelect }) => {
  const [selectedClass, setSelectedClass] = useState<
    (typeof classes)[0] | null
  >(null);

  const handleClassSelect = (characterClass: (typeof classes)[0]) => {
    setSelectedClass(characterClass);
    if (onSelect) {
      onSelect(characterClass);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Class</h3>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {classes.map((characterClass) => (
              <Card
                key={characterClass.id}
                className={`cursor-pointer transition-colors hover:bg-accent
                  ${
                    selectedClass?.id === characterClass.id
                      ? "border-primary"
                      : ""
                  }`}
                onClick={() => handleClassSelect(characterClass)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {characterClass.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{characterClass.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {characterClass.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        {selectedClass ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {selectedClass.icon}
                </div>
                <div>
                  <CardTitle>{selectedClass.name}</CardTitle>
                  <CardDescription>{selectedClass.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Hit Dice</h4>
                  <Badge>{selectedClass.hitDice}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Primary Ability</h4>
                  <Badge>{selectedClass.primaryAbility}</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Class Features</h4>
                <div className="space-y-2">
                  {selectedClass.features.map((feature, index) => (
                    <div key={index} className="flex flex-col gap-1">
                      <Badge variant="outline">{feature.name}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {feature.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Proficiencies</h4>
                <div className="space-y-2">
                  {selectedClass.proficiencies.armor.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Armor: </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClass.proficiencies.armor.join(", ")}
                      </span>
                    </div>
                  )}
                  {selectedClass.proficiencies.weapons.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Weapons: </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClass.proficiencies.weapons.join(", ")}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">Skills: </span>
                    <span className="text-sm text-muted-foreground">
                      Choose {selectedClass.proficiencies.skills} from:{" "}
                      {selectedClass.proficiencies.skillChoices.join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center text-muted-foreground p-6">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <p>Select a class to view its details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClassSelection;
