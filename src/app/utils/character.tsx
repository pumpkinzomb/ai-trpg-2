import {
  Crown,
  Swords,
  Footprints,
  Moon,
  Mountain,
  Scroll,
} from "lucide-react";
import { Character } from "../types";

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

export const checkArmorClassRestriction = (
  characterClass: string,
  armorType: string
): boolean => {
  // 클래스별 착용 가능한 방어구 타입 정의
  const armorRestrictions: { [key: string]: string[] } = {
    Barbarian: ["light-armor", "medium-armor"],
    Bard: ["light-armor", "medium-armor"],
    Cleric: ["light-armor", "medium-armor", "heavy-armor"],
    Druid: ["light-armor", "medium-armor"],
    Fighter: ["light-armor", "medium-armor", "heavy-armor"],
    Monk: ["light-armor"],
    Paladin: ["light-armor", "medium-armor", "heavy-armor"],
    Ranger: ["light-armor", "medium-armor"],
    Rogue: ["light-armor"],
    Sorcerer: ["light-armor"],
    Warlock: ["light-armor"],
    Wizard: ["light-armor"],
  };

  // 해당 클래스가 착용 가능한 방어구 타입 목록 가져오기
  const allowedArmorTypes = armorRestrictions[characterClass] || [];

  // 착용하려는 방어구 타입이 허용된 목록에 있는지 확인
  return allowedArmorTypes.includes(armorType);
};

// 클래스 특성이 AC에 영향을 미치는지 확인하는 함수
const getACBonusFromFeatures = (
  character: Character,
  baseAC: number,
  hasArmor: boolean
): number => {
  let bonus = 0;

  character.features.forEach((feature) => {
    switch (feature.name) {
      // 바바리안 특성
      case "Unarmored Defense":
        if (!hasArmor) {
          // 이미 calculatePlayerAC에서 처리됨
          break;
        }
        break;

      // 바드 특성
      case "College of Swords":
        // Blade Flourish - defensive flourish 사용 시
        // 실제 전투에서 bardic inspiration die를 소비할 때 처리해야 함
        break;
      case "College of Valor":
        // 특별한 AC 보너스는 없지만 중장 숙련도 획득
        break;

      // 성직자 특성
      case "Shield of Faith":
        // 주문이므로 별도 처리 필요
        break;

      // 드루이드 특성
      case "Primal Strike":
        // AC에 영향 없음
        break;

      // 파이터 특성
      case "Fighting Style":
        if (feature.effect?.includes("Defense") && hasArmor) {
          bonus += 1; // Defense fighting style: 방어구 착용 시 AC +1
        }
        break;
      case "Eldritch Knight":
        // Shield 주문 사용 가능 (별도 처리 필요)
        break;

      // 수도사 특성
      case "Unarmored Movement":
        // AC에 영향 없음
        break;
      case "Deflect Missiles":
        // 원거리 공격에 대한 피해 감소 (별도 처리 필요)
        break;
      case "Way of the Kensei":
        if (!hasArmor) {
          bonus += 2; // Agile Parry: 무장하지 않은 상태에서 켄세이 무기로 근접 공격 시
        }
        break;

      // 팔라딘 특성
      case "Divine Shield":
        // Shield of Faith 주문 사용 가능 (별도 처리 필요)
        break;
      case "Sacred Shield":
        // 반응행동으로 사용하는 능력 (별도 처리 필요)
        break;

      // 레인저 특성
      case "Deft Explorer":
        // AC에 직접적 영향 없음
        break;

      // 로그 특성
      case "Uncanny Dodge":
        // 피해 반감 (별도 처리 필요)
        break;
      case "Evasion":
        // 회피 (별도 처리 필요)
        break;

      // 소서러 특성
      case "Draconic Resilience":
        if (!hasArmor) {
          bonus += 3; // 13 + Dex modifier (이미 기본 AC에 포함된 경우 주의)
        }
        break;
      case "Stone's Durability":
        if (!hasArmor) {
          bonus += 1; // Stone Sorcery: AC +1
        }
        break;

      // 워락 특성
      case "Armor of Shadows":
        if (!hasArmor) {
          // Mage Armor 효과 (13 + Dex modifier)
          bonus = Math.max(bonus, 3); // 기존 보너스와 비교하여 더 높은 값 사용
        }
        break;
      case "Fiendish Resilience":
        // 특정 피해 유형에 대한 저항 (별도 처리 필요)
        break;

      // 위저드 특성
      case "Arcane Ward":
        // 피해 흡수 (별도 처리 필요)
        break;
      case "Bladesinging":
        if (!hasArmor && feature.effect?.includes("active")) {
          const intMod = Math.floor((character.stats.intelligence - 10) / 2);
          bonus += intMod; // Bladesong 활성화 시 INT 수정치만큼 AC 증가
        }
        break;
    }
  });

  return bonus;
};

// 종족 보너스 확인 함수
const getACBonusFromRace = (character: Character): number => {
  let bonus = 0;

  switch (character.race.toLowerCase()) {
    case "warforged":
      // 워포지드: 통합 보호 (Integrated Protection)
      bonus += 1;
      break;
    case "loxodon":
      // 록소돈: 자연 방어구 (Natural Armor) - 이미 기본 계산에 포함되므로 여기서는 처리하지 않음
      break;
    case "lizardfolk":
      // 리자드포크: 자연 방어구 13 + Dex modifier - 기본 계산에서 처리
      break;
    case "tortles":
      // 토틀: 자연 방어구 17 (Dex 무시) - 기본 계산에서 처리
      break;
    // 다른 종족들은 대부분 AC에 직접적인 영향을 주지 않음
  }

  return bonus;
};

// 개선된 AC 계산 함수
export const calculatePlayerAC = (character?: Character): number => {
  if (!character) return 10;

  const dexMod = Math.floor((character.stats.dexterity - 10) / 2);
  const wisMod = Math.floor((character.stats.wisdom - 10) / 2);
  const conMod = Math.floor((character.stats.constitution - 10) / 2);

  let baseAC = 10;
  let maxDexBonus = Infinity;
  let armorBonus = 0;
  let shieldBonus = 0;

  const hasArmor = !!character.equipment.armor;

  // 자연 방어구 처리 (종족 특성)
  switch (character.race.toLowerCase()) {
    case "lizardfolk":
      if (!hasArmor) {
        baseAC = 13;
      }
      break;
    case "tortles":
      if (!hasArmor) {
        return 17; // 고정 AC, Dex 무시
      }
      break;
  }

  // Unarmored Defense 체크 (Monk, Barbarian)
  const hasUnarmoredDefense = character.features.some(
    (f) => f.name === "Unarmored Defense"
  );

  if (!hasArmor && hasUnarmoredDefense) {
    switch (character.class.toLowerCase()) {
      case "monk":
        return 10 + dexMod + wisMod;
      case "barbarian":
        return 10 + dexMod + conMod;
    }
  }

  // 방어구 체크
  if (hasArmor) {
    const armor = character.equipment.armor;
    armorBonus = armor?.stats.defense || 0;

    switch (armor?.type) {
      case "light-armor":
        baseAC = armorBonus;
        break;
      case "medium-armor":
        baseAC = armorBonus;
        maxDexBonus = 2;
        break;
      case "heavy-armor":
        return (
          armorBonus +
          (character.equipment.shield?.stats.defense || 0) +
          getACBonusFromFeatures(character, armorBonus, true) +
          getACBonusFromRace(character)
        );
    }
  }

  // 방패 보너스
  if (character.equipment.shield) {
    shieldBonus = character.equipment.shield.stats.defense || 0;
  }

  // 장신구 효과 적용
  const accessoryBonus = character.equipment.accessories.reduce(
    (bonus, accessory) => {
      const acEffect = accessory.stats.effects?.find(
        (effect) =>
          effect.type === "ac_bonus" || effect.type === "defense_bonus"
      );
      return bonus + (acEffect ? parseInt(acEffect.value) || 0 : 0);
    },
    0
  );

  // 클래스 특성 보너스
  const featureBonus = getACBonusFromFeatures(character, baseAC, hasArmor);

  // 종족 보너스
  const raceBonus = getACBonusFromRace(character);

  // 최종 AC 계산
  const finalDexBonus = Math.min(dexMod, maxDexBonus);
  return (
    baseAC +
    finalDexBonus +
    shieldBonus +
    accessoryBonus +
    featureBonus +
    raceBonus
  );
};
