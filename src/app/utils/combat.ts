export const calculateAbilityEffects = (
  damage: number,
  activeEffects: Array<{
    id: string;
    name: string;
    duration: number;
    type: "buff" | "debuff";
  }>,
  characterClass?: string
) => {
  let finalDamage = damage;
  let hasAdvantage = false;
  let extraAttacks = 0;

  activeEffects.forEach((effect) => {
    switch (effect.id) {
      // 바바리안
      case "rage":
        if (characterClass?.toLowerCase() === "barbarian") {
          finalDamage += 2;
          hasAdvantage = true;
        }
        break;

      // 팔라딘
      case "divine-smite":
        const smiteDamage =
          Math.floor(Math.random() * 8) + 1 + Math.floor(Math.random() * 8) + 1;
        finalDamage += smiteDamage;
        break;

      // 레인저
      case "hunters-mark":
        const huntersDamage = Math.floor(Math.random() * 6) + 1;
        finalDamage += huntersDamage;
        break;

      // 파이터
      case "action-surge":
        extraAttacks += 1;
        break;
      case "second-wind":
        // 치유는 별도 처리
        break;

      // 로그
      case "sneak-attack":
        if (characterClass?.toLowerCase() === "rogue") {
          const sneakDamage = Math.floor(Math.random() * 6) + 1;
          finalDamage += sneakDamage;
        }
        break;

      // 몽크
      case "flurry-of-blows":
        if (characterClass?.toLowerCase() === "monk") {
          extraAttacks += 2;
        }
        break;

      // 와록
      case "eldritch-blast":
        if (characterClass?.toLowerCase() === "warlock") {
          const eldritchDamage = Math.floor(Math.random() * 10) + 1;
          finalDamage += eldritchDamage;
        }
        break;

      // 바드
      case "bardic-inspiration":
        const inspirationBonus = Math.floor(Math.random() * 6) + 1;
        finalDamage += inspirationBonus;
        break;

      // 소서러
      case "metamagic":
        // 메타매직 효과 (예: 쌍둥이 주문)
        finalDamage *= 2;
        break;

      // 드루이드
      case "wild-shape":
        // 야생 변신 상태의 추가 피해
        finalDamage += 2;
        break;

      // 위저드
      case "arcane-recovery":
        // 주문 회복은 별도 처리
        break;
    }
  });

  return {
    finalDamage,
    hasAdvantage,
    extraAttacks,
  };
};

export const processSpecialAbilityHeal = (
  effect: {
    id: string;
    name: string;
  },
  characterLevel: number
): number => {
  switch (effect.id) {
    case "second-wind":
      // 파이터 치유의 기운: 1d10 + 레벨
      return Math.floor(Math.random() * 10) + 1 + characterLevel;

    case "lay-on-hands":
      // 팔라딘 치유
      return characterLevel * 5;

    case "healing-word":
      // 클레릭/바드 치유
      return Math.floor(Math.random() * 4) + 1;

    default:
      return 0;
  }
};

export const calculateIncomingDamage = (
  damage: number,
  activeEffects: Array<{
    id: string;
    name: string;
    duration: number;
    type: "buff" | "debuff";
  }>,
  characterClass?: string
) => {
  let finalDamage = damage;

  activeEffects.forEach((effect) => {
    switch (effect.id) {
      case "rage":
        if (characterClass?.toLowerCase() === "barbarian") {
          finalDamage = Math.floor(finalDamage / 2);
        }
        break;

      case "shield":
        // 마법사 방어 주문
        finalDamage = Math.max(0, finalDamage - 5);
        break;

      case "defensive-stance":
        // 파이터 방어 태세
        finalDamage = Math.max(0, finalDamage - 2);
        break;

      case "uncanny-dodge":
        // 로그 회피
        if (characterClass?.toLowerCase() === "rogue") {
          finalDamage = Math.floor(finalDamage / 2);
        }
        break;

      case "wild-shape":
        // 드루이드 야생 변신 상태의 추가 저항
        finalDamage = Math.floor(finalDamage * 0.8);
        break;
    }
  });

  return finalDamage;
};
