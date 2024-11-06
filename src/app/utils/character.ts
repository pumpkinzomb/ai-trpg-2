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
