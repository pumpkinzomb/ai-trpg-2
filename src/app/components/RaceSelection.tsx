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
  Swords,
  Brain,
  Heart,
  Footprints,
  Eye,
  Sun,
  Moon,
  Mountain,
  Trees,
  Crown,
  Scroll,
} from "lucide-react";

export const commonRaces = [
  {
    id: "human",
    name: "Human",
    icon: <Crown className="w-8 h-8" />,
    description:
      "Versatile and ambitious, humans are adaptable to any situation.",
    traits: [
      { name: "Ability Scores", value: "All ability scores increase by 1" },
      { name: "Extra Language", value: "Learn one additional language" },
      {
        name: "Skill Versatility",
        value: "Gain proficiency in one additional skill",
      },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common"],
  },
  {
    id: "dwarf",
    name: "Dwarf",
    icon: <Mountain className="w-8 h-8" />,
    description: "Strong, hardy, and devoted to clan and tradition.",
    traits: [
      { name: "Constitution", value: "+2 Constitution" },
      { name: "Darkvision", value: "60 feet" },
      {
        name: "Dwarven Resilience",
        value: "Advantage on poison saving throws",
      },
    ],
    size: "Medium",
    speed: 25,
    languages: ["Common", "Dwarvish"],
  },
  {
    id: "elf",
    name: "Elf",
    icon: <Moon className="w-8 h-8" />,
    description: "Graceful, magical beings with a deep connection to nature.",
    traits: [
      { name: "Dexterity", value: "+2 Dexterity" },
      { name: "Darkvision", value: "60 feet" },
      { name: "Keen Senses", value: "Proficiency in Perception" },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common", "Elvish"],
  },
  {
    id: "halfling",
    name: "Halfling",
    icon: <Footprints className="w-8 h-8" />,
    description: "Small, nimble folk known for their luck and courage.",
    traits: [
      { name: "Dexterity", value: "+2 Dexterity" },
      {
        name: "Lucky",
        value: "Reroll 1s on attack rolls, ability checks, and saving throws",
      },
      {
        name: "Brave",
        value: "Advantage on saving throws against being frightened",
      },
    ],
    size: "Small",
    speed: 25,
    languages: ["Common", "Halfling"],
  },
];

export const exoticRaces = [
  {
    id: "dragonborn",
    name: "Dragonborn",
    icon: <Swords className="w-8 h-8" />,
    description:
      "Dragon-blooded warriors with breath weapons and proud heritage.",
    traits: [
      { name: "Strength", value: "+2 Strength" },
      { name: "Charisma", value: "+1 Charisma" },
      {
        name: "Breath Weapon",
        value: "Deal dragon-type damage in a 15-foot cone",
      },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common", "Draconic"],
  },
  {
    id: "tiefling",
    icon: <Scroll className="w-8 h-8" />,
    name: "Tiefling",
    description: "Descendants of fiends with magical affinity and dark charm.",
    traits: [
      { name: "Charisma", value: "+2 Charisma" },
      { name: "Intelligence", value: "+1 Intelligence" },
      { name: "Infernal Legacy", value: "Innate spellcasting abilities" },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common", "Infernal"],
  },
];

interface RaceSelectionProps {
  races: typeof commonRaces;
  onSelect?: (race: (typeof commonRaces)[0]) => void;
}

const RaceSelection: React.FC<RaceSelectionProps> = ({ onSelect }) => {
  const [selectedRace, setSelectedRace] = useState<
    (typeof commonRaces)[0] | null
  >(null);

  const handleRaceSelect = (race: (typeof commonRaces)[0]) => {
    setSelectedRace(race);
    if (onSelect) {
      onSelect(race);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Race</h3>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {[...commonRaces, ...exoticRaces].map((race) => (
              <Card
                key={race.id}
                className={`cursor-pointer transition-colors hover:bg-accent
                  ${selectedRace?.id === race.id ? "border-primary" : ""}`}
                onClick={() => handleRaceSelect(race)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {race.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{race.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {race.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        {selectedRace ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {selectedRace.icon}
                </div>
                <div>
                  <CardTitle>{selectedRace.name}</CardTitle>
                  <CardDescription>{selectedRace.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Racial Traits</h4>
                <div className="space-y-2">
                  {selectedRace.traits.map((trait, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{trait.name}</Badge>
                      <span className="text-sm">{trait.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Size</h4>
                  <Badge>{selectedRace.size}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Speed</h4>
                  <Badge>{selectedRace.speed} ft.</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Languages</h4>
                <div className="flex gap-2">
                  {selectedRace.languages.map((language) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center text-muted-foreground p-6">
              <Eye className="w-12 h-12 mx-auto mb-4" />
              <p>Select a race to view its details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RaceSelection;
