import {
  Crown,
  Swords,
  Footprints,
  Moon,
  Mountain,
  Scroll,
} from "lucide-react";

export const calculateInitialHP = (
  characterClass: string,
  constitutionScore: number
) => {
  const constitutionModifier = Math.floor((constitutionScore - 10) / 2);
  const classHitDice = {
    barbarian: 12,
    fighter: 10,
    paladin: 10,
    ranger: 10,
    bard: 8,
    cleric: 8,
    druid: 8,
    monk: 8,
    rogue: 8,
    warlock: 8,
    sorcerer: 6,
    wizard: 6,
  };

  return (
    classHitDice[characterClass as keyof typeof classHitDice] +
    constitutionModifier
  );
};

export const getHitDice = (characterClass: string) => {
  const hitDice = {
    barbarian: "d12",
    fighter: "d10",
    paladin: "d10",
    ranger: "d10",
    bard: "d8",
    cleric: "d8",
    druid: "d8",
    monk: "d8",
    rogue: "d8",
    warlock: "d8",
    sorcerer: "d6",
    wizard: "d6",
  };

  return hitDice[characterClass as keyof typeof hitDice];
};

// 시작 골드 범위 (직업별 주사위)
const STARTING_GOLD_DICE: Record<
  string,
  { count: number; dice: number; multiplier: number }
> = {
  barbarian: { count: 2, dice: 4, multiplier: 10 }, // 2d4 × 10
  bard: { count: 5, dice: 4, multiplier: 10 }, // 5d4 × 10
  cleric: { count: 5, dice: 4, multiplier: 10 }, // 5d4 × 10
  druid: { count: 2, dice: 4, multiplier: 10 }, // 2d4 × 10
  fighter: { count: 5, dice: 4, multiplier: 10 }, // 5d4 × 10
  monk: { count: 5, dice: 4, multiplier: 1 }, // 5d4
  paladin: { count: 5, dice: 4, multiplier: 10 }, // 5d4 × 10
  ranger: { count: 5, dice: 4, multiplier: 10 }, // 5d4 × 10
  rogue: { count: 4, dice: 4, multiplier: 10 }, // 4d4 × 10
  sorcerer: { count: 3, dice: 4, multiplier: 10 }, // 3d4 × 10
  warlock: { count: 4, dice: 4, multiplier: 10 }, // 4d4 × 10
  wizard: { count: 4, dice: 4, multiplier: 10 }, // 4d4 × 10
};

export const getStartingGold = (characterClass: string): number => {
  const goldDice = STARTING_GOLD_DICE[characterClass];
  if (!goldDice) {
    throw new Error(`Invalid class: ${characterClass}`);
  }

  // 주사위 굴리기
  let total = 0;
  for (let i = 0; i < goldDice.count; i++) {
    total += Math.floor(Math.random() * goldDice.dice) + 1;
  }

  // 최종 금액 계산 (주사위 합계 × 배수)
  return total * goldDice.multiplier;
};

export const commonRaces = [
  {
    id: "human",
    name: "Human",
    icon: <Crown className="w-8 h-8" />,
    description: "어떤 상황에도 적응할 수 있는 다재다능하고 야심 찬 종족.",
    traits: [
      { name: "Ability Scores", value: "모든 능력치가 1씩 증가" },
      { name: "Extra Language", value: "추가 언어 하나를 습득" },
      {
        name: "Skill Versatility",
        value: "추가 기술 하나에 대한 숙련 획득",
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
    description: "씩씩하고 강인하며 씨족과 전통을 중시하는 종족.",
    traits: [
      { name: "Constitution", value: "건강 +2" },
      { name: "Darkvision", value: "어둠 속 시야 60피트" },
      {
        name: "Dwarven Resilience",
        value: "독성 내성 굴림에 이점",
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
    description: "자연과 깊은 교감을 나누는 우아하고 마법적인 존재.",
    traits: [
      { name: "Dexterity", value: "민첩 +2" },
      { name: "Darkvision", value: "어둠 속 시야 60피트" },
      { name: "Keen Senses", value: "감지 기술 숙련" },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common", "Elvish"],
  },
  {
    id: "halfling",
    name: "Halfling",
    icon: <Footprints className="w-8 h-8" />,
    description: "행운과 용기로 알려진 작고 민첩한 종족.",
    traits: [
      { name: "Dexterity", value: "민첩 +2" },
      {
        name: "Lucky",
        value: "공격 굴림, 능력 판정, 내성 굴림에서 1이 나오면 재굴림",
      },
      {
        name: "Brave",
        value: "공포에 대한 내성 굴림에 이점",
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
      "용의 피를 이어받은 자긍심 높은 전사 종족으로, 브레스 무기를 사용할 수 있다.",
    traits: [
      { name: "Strength", value: "근력 +2" },
      { name: "Charisma", value: "매력 +1" },
      {
        name: "Breath Weapon",
        value: "15피트 원뿔 범위에 용의 브레스 속성 피해",
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
    description: "마법적 친화력과 어두운 매력을 지닌 마귀의 자손.",
    traits: [
      { name: "Charisma", value: "매력 +2" },
      { name: "Intelligence", value: "지능 +1" },
      { name: "Infernal Legacy", value: "타고난 주문시전 능력" },
    ],
    size: "Medium",
    speed: 30,
    languages: ["Common", "Infernal"],
  },
];

// 클래스별 초기 스펠 슬롯 및 리소스 설정
export function getInitialSpellSlots(characterClass: string) {
  // 마법 사용 클래스들의 1레벨 주문 슬롯
  const spellSlotsByClass: Record<
    string,
    Array<{ level: number; total: number; used: number }>
  > = {
    wizard: [
      { level: 1, total: 2, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    sorcerer: [
      { level: 1, total: 2, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    cleric: [
      { level: 1, total: 2, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    druid: [
      { level: 1, total: 2, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    bard: [
      { level: 1, total: 2, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    warlock: [
      { level: 1, total: 1, used: 0 },
      { level: 2, total: 0, used: 0 },
    ],
    paladin: [
      { level: 1, total: 0, used: 0 }, // 팔라딘은 2레벨부터 주문 사용 가능
      { level: 2, total: 0, used: 0 },
    ],
    ranger: [
      { level: 1, total: 0, used: 0 }, // 레인저는 2레벨부터 주문 사용 가능
      { level: 2, total: 0, used: 0 },
    ],
  };

  // 비마법 클래스들은 빈 배열 반환
  return spellSlotsByClass[characterClass.toLowerCase()] || [];
}

export function getInitialResource(characterClass: string): {
  current: number;
  max: number;
  name: string;
} {
  const resourceConfig: Record<string, { max: number; name: string }> = {
    // 마법 사용 클래스
    wizard: {
      max: 20,
      name: "Mana",
    },
    sorcerer: {
      max: 20,
      name: "Mana",
    },
    cleric: {
      max: 20,
      name: "Mana",
    },
    druid: {
      max: 20,
      name: "Mana",
    },
    bard: {
      max: 15,
      name: "Mana",
    },
    warlock: {
      max: 15,
      name: "Mana",
    },

    // 물리 클래스
    barbarian: {
      max: 10,
      name: "Rage",
    },
    monk: {
      max: 10,
      name: "Ki",
    },
    paladin: {
      max: 15,
      name: "Divine Power",
    },
    ranger: {
      max: 15,
      name: "Focus",
    },

    // 비마법 클래스
    fighter: {
      max: 10,
      name: "Stamina",
    },
    rogue: {
      max: 10,
      name: "Energy",
    },
  };

  const defaultResource = { max: 10, name: "Energy" };
  const config =
    resourceConfig[characterClass.toLowerCase()] || defaultResource;

  return {
    current: config.max, // 초기에는 최대값으로 설정
    max: config.max,
    name: config.name,
  };
}
