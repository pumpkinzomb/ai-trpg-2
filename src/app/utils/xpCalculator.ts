export function getBaseXPForLevel(level: number): number {
  // 레벨별 기본 경험치 계산
  // 예시: 기본값 100에서 레벨당 15% 증가
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// 던전 실패 시 경험치 계산 함수
export function calculateFailureXP(
  dungeon: any,
  characterLevel: number
): number {
  // 레벨별 기본 스테이지 경험치
  const baseXPPerStage = getBaseXPForLevel(characterLevel);

  // 현재까지 진행한 스테이지 수
  const completedStages = dungeon.currentStage;

  // 던전 레벨과 캐릭터 레벨 차이에 따른 보정
  const levelDiff = Math.max(
    -5,
    Math.min(5, dungeon.recommendedLevel - characterLevel)
  );

  // 레벨 차이에 따른 경험치 보정
  // 높은 레벨 던전은 더 많은 경험치, 낮은 레벨 던전은 적은 경험치
  let levelMultiplier = 1;
  if (levelDiff > 0) {
    // 높은 레벨 던전
    levelMultiplier = 1 + levelDiff * 0.2; // 레벨당 20% 증가
  } else if (levelDiff < 0) {
    // 낮은 레벨 던전
    levelMultiplier = Math.max(0.1, 1 + levelDiff * 0.15); // 최소 10%까지 감소
  }

  // 기본 경험치 계산
  let xp = baseXPPerStage * completedStages * levelMultiplier;

  // 보스 직전까지 진행했다면 추가 보너스
  if (completedStages === dungeon.maxStages - 1) {
    xp *= 1.5; // 50% 추가 보너스
  }

  return Math.floor(xp);
}

// 던전 완료 시 경험치 계산 함수
export function calculateCompletionXP(
  dungeon: any,
  characterLevel: number
): number {
  // 레벨별 기본 경험치
  const baseXP = getBaseXPForLevel(characterLevel);

  // 스테이지 수에 따른 보너스
  const stageBonus = dungeon.maxStages * (baseXP * 0.2); // 스테이지당 기본 경험치의 20%

  // 던전 레벨과 캐릭터 레벨 차이에 따른 보정
  const levelDiff = Math.max(
    -5,
    Math.min(5, dungeon.recommendedLevel - characterLevel)
  );

  // 레벨 차이에 따른 경험치 보정
  let levelMultiplier = 1;
  if (levelDiff > 0) {
    // 높은 레벨 던전
    levelMultiplier = 1 + levelDiff * 0.2; // 레벨당 20% 증가
  } else if (levelDiff < 0) {
    // 낮은 레벨 던전
    levelMultiplier = Math.max(0.1, 1 + levelDiff * 0.15); // 최소 10%까지 감소
  }

  // 총 경험치에 던전 난이도 보너스 추가
  const difficultyBonus =
    dungeon.recommendedLevel > characterLevel
      ? baseXP * 0.1 // 높은 레벨 던전 추가 보너스
      : 0;

  return Math.floor((baseXP + stageBonus + difficultyBonus) * levelMultiplier);
}

// 레벨업에 필요한 경험치 계산 (참고용)
export function getRequiredXPForLevel(level: number): number {
  // 레벨별 필요 경험치 계산
  // 예시: 기본값 1000에서 레벨당 50% 증가
  return Math.floor(1000 * Math.pow(1.5, level - 1));
}
