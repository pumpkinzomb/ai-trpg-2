import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Wand2,
  Music,
  Leaf,
  Sun,
  Moon,
  Swords,
  Crown,
  Crosshair,
  Eye,
} from "lucide-react";

export interface ClassFeature {
  name: string;
  value: string;
}

export interface ClassProficiencies {
  armor: string[];
  weapons: string[];
  tools: string[];
  skills: number;
  skillChoices: string[];
}

export interface CharacterClass {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  hitDice: string;
  primaryAbility: string;
  savingThrows: string[];
  features: ClassFeature[];
  proficiencies: ClassProficiencies;
}

export const classes: CharacterClass[] = [
  {
    id: "barbarian",
    name: "Barbarian",
    icon: <Swords className="w-8 h-8" />,
    description: "원시적 본능에 의해 전투 분노를 일으키는 용맹한 전사들.",
    hitDice: "d12",
    primaryAbility: "Strength",
    savingThrows: ["Strength", "Constitution"],
    features: [
      {
        name: "Rage",
        value: "강력한 전투 분노 상태에 진입하여 전투 능력 강화",
      },
      {
        name: "Unarmored Defense",
        value: "갑옷을 입지 않았을 때 체력을 통해 방어도 보너스 획득",
      },
      {
        name: "Reckless Attack",
        value: "적이 자신을 공격할 때 이점을 주는 대가로 공격에 이점 획득",
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
    description: "음악으로 마법을 엮고 동료들을 고무시키는 마법 예능인.",
    hitDice: "d8",
    primaryAbility: "Charisma",
    savingThrows: ["Dexterity", "Charisma"],
    features: [
      { name: "Bardic Inspiration", value: "동료들에게 영감 주사위 부여" },
      { name: "Spellcasting", value: "매력을 사용하여 바드 주문 시전" },
      {
        name: "Jack of All Trades",
        value: "숙련되지 않은 능력 판정에 절반의 숙련 보너스 추가",
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
    description: "자연의 마법을 다루고 변신할 수 있는 자연의 사제들.",
    hitDice: "d8",
    primaryAbility: "Wisdom",
    savingThrows: ["Intelligence", "Wisdom"],
    features: [
      { name: "Druidic", value: "드루이드의 비밀 언어를 구사" },
      { name: "Spellcasting", value: "지혜를 사용하여 드루이드 주문 시전" },
      { name: "Wild Shape", value: "다양한 동물 형태로 변신" },
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
    description: "신체와 영혼의 힘을 다스리는 무술의 달인.",
    hitDice: "d8",
    primaryAbility: "Dexterity & Wisdom",
    savingThrows: ["Strength", "Dexterity"],
    features: [
      {
        name: "Unarmored Defense",
        value: "갑옷을 입지 않았을 때 지혜를 통해 방어도 보너스 획득",
      },
      {
        name: "Martial Arts",
        value: "맨손 공격과 승려 무기에 민첩을 사용",
      },
      { name: "Ki", value: "특수 능력을 위한 마법 에너지 사용" },
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
      "정의와 의로움을 수호하기 위해 신성한 맹세로 묶인 성스러운 전사.",
    hitDice: "d10",
    primaryAbility: "Strength & Charisma",
    savingThrows: ["Wisdom", "Charisma"],
    features: [
      { name: "Divine Sense", value: "천상의 존재, 악마, 언데드를 감지" },
      {
        name: "Lay on Hands",
        value: "상처와 질병을 치료하는 치유의 힘",
      },
      {
        name: "Divine Smite",
        value: "신성한 에너지를 강력한 무기 공격에 주입",
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
    description: "추적과 사냥에 능숙한 황야의 전사.",
    hitDice: "d10",
    primaryAbility: "Dexterity & Wisdom",
    savingThrows: ["Strength", "Dexterity"],
    features: [
      {
        name: "Favored Enemy",
        value: "특정 유형의 생물에 대한 전투 이점 획득",
      },
      {
        name: "Natural Explorer",
        value: "특정 지형에서의 전문적인 탐험 능력",
      },
      { name: "Spellcasting", value: "지혜를 사용하여 레인저 주문 시전" },
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
      "천부적인 재능이나 혈통에서 비롯된 내재된 마법을 사용하는 마법사.",
    hitDice: "d6",
    primaryAbility: "Charisma",
    savingThrows: ["Constitution", "Charisma"],
    features: [
      { name: "Spellcasting", value: "매력을 사용하여 소서러 주문 시전" },
      { name: "Sorcerous Origin", value: "마법력의 원천 선택" },
      {
        name: "Font of Magic",
        value: "마법 효과를 위한 소서리 포인트 획득",
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
    description: "이계의 후원자로부터 받은 마법을 다루는 자.",
    hitDice: "d8",
    primaryAbility: "Charisma",
    savingThrows: ["Wisdom", "Charisma"],
    features: [
      { name: "Otherworldly Patron", value: "강력한 존재와 계약 체결" },
      { name: "Pact Magic", value: "매력을 사용하여 워락 주문 시전" },
      { name: "Eldritch Invocations", value: "초자연적 능력 획득" },
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
  onSelect: (selectedClass: CharacterClass) => void;
  onProficienciesChange: (proficiencies: string[]) => void;
  selectedClassId?: string;
}

const ClassSelection: React.FC<ClassSelectionProps> = ({
  onSelect,
  onProficienciesChange,
  selectedClassId,
}) => {
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    classes.find((c) => c.id === selectedClassId) || null
  );
  const [selectedProficiencies, setSelectedProficiencies] = useState<string[]>(
    []
  );

  // handleProficiencyToggle 수정
  const handleProficiencyToggle = (skill: string) => {
    if (!selectedClass) return;

    const maxSkills = selectedClass.proficiencies.skills;
    let newSelection = [...selectedProficiencies];

    if (newSelection.includes(skill)) {
      newSelection = newSelection.filter((s) => s !== skill);
    } else if (newSelection.length < maxSkills) {
      newSelection = [...newSelection, skill];
    } else {
      return; // 최대 선택 가능 개수를 초과하면 리턴
    }

    setSelectedProficiencies(newSelection);
    onProficienciesChange(newSelection);
  };

  // 클래스 변경 시 프로피션시 초기화
  const handleClassSelect = (characterClass: CharacterClass) => {
    setSelectedClass(characterClass);
    setSelectedProficiencies([]); // Reset proficiencies
    onSelect(characterClass);
    onProficienciesChange([]); // Reset proficiencies in parent component
  };

  // 컴포넌트 마운트 시 또는 selectedClassId 변경 시 초기화
  useEffect(() => {
    if (selectedClassId) {
      const newSelectedClass = classes.find((c) => c.id === selectedClassId);
      if (newSelectedClass) {
        setSelectedClass(newSelectedClass);
      }
    }
  }, [selectedClassId]);

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Left column - Class selection */}
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

      {/* Right column - Class details and proficiency selection */}
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
                <div className="space-y-4">
                  {/* Armor Proficiencies */}
                  {selectedClass.proficiencies.armor.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Armor: </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClass.proficiencies.armor.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Weapon Proficiencies */}
                  {selectedClass.proficiencies.weapons.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Weapons: </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedClass.proficiencies.weapons.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Skill Proficiencies */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Skills </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedProficiencies.length}/
                        {selectedClass.proficiencies.skills} selected
                      </span>
                    </div>
                    <div className="space-y-2">
                      {selectedClass.proficiencies.skillChoices.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={skill}
                            checked={selectedProficiencies.includes(skill)}
                            onCheckedChange={() =>
                              handleProficiencyToggle(skill)
                            }
                            disabled={
                              !selectedProficiencies.includes(skill) &&
                              selectedProficiencies.length >=
                                selectedClass.proficiencies.skills
                            }
                          />
                          <label
                            htmlFor={skill}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {skill}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center text-muted-foreground p-6">
              <Eye className="w-12 h-12 mx-auto mb-4" />
              <p>Select a class to view its details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClassSelection;
