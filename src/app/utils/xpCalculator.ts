import { DungeonState } from "../types";

export function getBaseXPForLevel(level: number): number {
  // 레벨별 기본 경험치 계산
  // 예시: 기본값 100에서 레벨당 15% 증가
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// 던전 실패 시 경험치 계산 함수
export function calculateFailureXP(
  dungeonData: {
    currentStage: number;
    maxStages: number;
    logs: any[];
  },
  characterLevel: number
): number {
  // 레벨별 기본 스테이지 경험치
  const baseXPPerStage = getBaseXPForLevel(characterLevel);

  // 현재까지 진행한 스테이지 수
  const completedStages = dungeonData.currentStage;

  // 던전 난이도에 따른 보정
  // recommendedLevel이 없으므로, 스테이지 수에 기반한 난이도 보정으로 변경
  const difficultyMultiplier = Math.min(1.5, 1 + dungeonData.maxStages / 10); // 최대 50% 보너스

  // 기본 경험치 계산
  let xp = baseXPPerStage * completedStages * difficultyMultiplier;

  // 보스 직전까지 진행했다면 추가 보너스
  if (completedStages === dungeonData.maxStages - 1) {
    xp *= 1.5; // 50% 추가 보너스
  }

  // 최소 경험치 보장 (적어도 기본 경험치의 10%는 받도록)
  const minimumXP = Math.floor(baseXPPerStage * 0.1);
  xp = Math.max(minimumXP, Math.floor(xp));

  return Math.floor(xp);
}

// 던전 완료 시 경험치 계산 함수
export function calculateCompletionXP(
  dungeon: DungeonState,
  characterLevel: number
): number {
  // 레벨별 기본 경험치
  const baseXP = getBaseXPForLevel(characterLevel);

  // 스테이지 수에 따른 보너스
  const stageBonus = dungeon.maxStages * (baseXP * 0.2); // 스테이지당 기본 경험치의 20%

  // 던전 난이도 승수 (최대 스테이지 수 기반)
  // 더 긴 던전 = 더 어려운 던전으로 간주
  const difficultyMultiplier = Math.min(2.0, 1 + dungeon.maxStages / 8); // 최대 100% 보너스

  // 보스 스테이지 클리어 보너스
  const bossBonus = baseXP * 0.5; // 보스 처치 보너스 50%

  // 진행도 보너스 (100% 완료 시에만)
  const completionBonus = baseXP * 0.3; // 완료 보너스 30%

  // 총 경험치 계산
  const totalXP =
    (baseXP + stageBonus + bossBonus + completionBonus) * difficultyMultiplier;

  // 디버깅을 위한 계산 과정 로깅
  console.log("Completion XP Calculation:", {
    baseXP,
    stageBonus,
    difficultyMultiplier,
    bossBonus,
    completionBonus,
    totalXP: Math.floor(totalXP),
  });

  return Math.floor(totalXP);
}
