import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Heart,
  Swords,
  Shield,
  Clock,
  Sword,
  SkullIcon,
  Flame,
  Zap,
  Shield as ShieldIcon,
  LucideIcon,
  Sun,
  Eye,
  Ghost,
  Sparkles,
  Moon,
  Wand2,
  Leaf,
  Music,
  Target,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Character } from "@/app/types";
import { calculatePlayerAC } from "@/app/utils/character";
import { useToast } from "@/hooks/use-toast";
import DiceIcon from "./DiceIcon";
import CombatLog from "./CombatLog";

type InitiativeRoll = {
  name: string;
  roll: number;
  isPlayer: boolean;
  enemyIndex?: number;
};

// 인터페이스 정의
interface DungeonCombatProps {
  enemies: {
    name: string;
    level: number;
    hp: number;
    ac: number;
    attacks: {
      name: string;
      damage: string;
      toHit: number;
    }[];
  }[];
  playerHp: number;
  maxPlayerHp: number;
  character?: Character;
  onCombatEnd: (result: { victory: boolean; remainingHp: number }) => void;
  onCombatStart: (value: boolean) => void;
  dungeonName: string;
  dungeonConcept: string;
}

interface CombatImage {
  url: string | null;
  loading: boolean;
}

interface CombatEffect {
  type: "damage" | "heal" | "buff" | "debuff" | "miss";
  value: number;
  target: number | "player";
  duration?: number;
  text?: string;
}

interface CombatState {
  effects: CombatEffect[];
  activeEffects: {
    id: string;
    name: string;
    duration: number;
    type: "buff" | "debuff";
  }[];
  currentRound: number;
  advantage: "none" | "advantage" | "disadvantage";
}

interface ClassAbility {
  name: string;
  description: string;
  type: "passive" | "active";
  usesPerRound?: number;
  currentUses?: number;
  resourceCost?: {
    type: "hp" | "resource" | "slots";
    value: number;
  };
  effect: (state: CombatState) => CombatState;
  icon: LucideIcon;
  conditions?: {
    minHp?: number;
    maxHp?: number;
    requiresWeapon?: boolean;
    requiresSpellSlot?: boolean;
  };
}

export default function DungeonCombat({
  enemies,
  playerHp,
  maxPlayerHp,
  character,
  onCombatEnd,
  dungeonName,
  dungeonConcept,
  onCombatStart,
}: DungeonCombatProps) {
  // State 정의
  const [combatLog, setCombatLog] = useState<
    Array<{
      text: string;
      type: "normal" | "critical" | "miss" | "system";
    }>
  >([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [turnOrder, setTurnOrder] = useState<
    Array<{
      name: string;
      isPlayer: boolean;
      enemyIndex?: number;
    }>
  >([]);
  const [enemyState, setEnemyState] = useState(() => {
    const initialState = enemies.map((enemy) => ({
      ...enemy,
      currentHp: enemy.hp,
      status: [] as string[],
    }));
    return initialState;
  });
  const [currentPlayerHp, setCurrentPlayerHp] = useState(playerHp);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [combatStarted, setCombatStarted] = useState(false);
  const [combatImage, setCombatImage] = useState<CombatImage>({
    url: null,
    loading: false,
  });
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [combatState, setCombatState] = useState<CombatState>({
    effects: [],
    activeEffects: [],
    currentRound: 1,
    advantage: "none",
  });
  const [availableActions, setAvailableActions] = useState<ClassAbility[]>([]);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [lastAttackRoll, setLastAttackRoll] = useState<{
    roll: number;
    modifier: number;
    total: number;
    type: "normal" | "critical" | "miss";
  } | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceResult, setDiceResult] = useState<{
    sides: number;
    result: number;
    rolling: boolean;
  } | null>(null);

  const { toast } = useToast();

  console.log("combatLog", combatLog);

  // 1. 기본 유틸리티 함수들
  const addCombatLog = useCallback(
    (
      text: string,
      type: "normal" | "critical" | "miss" | "system" = "normal"
    ) => {
      setCombatLog((prev) => [...prev, { text, type }]);
    },
    []
  );

  const rollDice = useCallback(
    (
      sides: number,
      count: number = 1,
      advantage: "none" | "advantage" | "disadvantage" = "none"
    ) => {
      if (advantage === "none") {
        let total = 0;
        const rolls = [];
        for (let i = 0; i < count; i++) {
          const roll = Math.floor(Math.random() * sides) + 1;
          rolls.push(roll);
          total += roll;
        }
        return { total, rolls };
      }

      const roll1 = Math.floor(Math.random() * sides) + 1;
      const roll2 = Math.floor(Math.random() * sides) + 1;

      return {
        total:
          advantage === "advantage"
            ? Math.max(roll1, roll2)
            : Math.min(roll1, roll2),
        rolls: [roll1, roll2],
      };
    },
    []
  );

  const rollDiceWithAnimation = useCallback(
    async (
      sides: number,
      count: number = 1,
      advantage: "none" | "advantage" | "disadvantage" = "none"
    ) => {
      // 먼저 주사위 굴리기 시작
      setDiceRolling(true);
      console.log("Started rolling animation");

      try {
        // 실제 애니메이션 시간 동안 대기
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 실제 주사위 결과 계산
        const result = rollDice(sides, count, advantage);

        return result;
      } finally {
        // 애니메이션 종료
        setDiceRolling(false);
        console.log("Ended rolling animation");
      }
    },
    [rollDice]
  );

  const showAttackEffect = useCallback(
    (
      type: "damage" | "heal" | "buff" | "debuff" | "miss",
      value: number,
      targetIndex: number | "player",
      text?: string
    ) => {
      setCombatState((prev) => ({
        ...prev,
        effects: [
          ...prev.effects,
          {
            type,
            value,
            target: targetIndex,
            text: text || type === "miss" ? "MISS!" : undefined,
          },
        ],
      }));

      setTimeout(() => {
        setCombatState((prev) => ({
          ...prev,
          effects: prev.effects.filter(
            (e) =>
              !(
                e.type === type &&
                e.value === value &&
                e.target === targetIndex
              )
          ),
        }));
      }, 1000);
    },
    []
  );

  // 2. 전투 상태 체크 함수
  const checkCombatEnd = useCallback(() => {
    let isEnded = false;

    if (currentPlayerHp <= 0) {
      addCombatLog("플레이어가 쓰러졌습니다!", "system");
      onCombatEnd({ victory: false, remainingHp: 0 });
      isEnded = true;
    }

    const allEnemiesDead = enemyState.every((enemy) => enemy.currentHp <= 0);
    if (allEnemiesDead) {
      // 이미 "쓰러졌습니다" 메시지가 출력된 후에만 전투 종료 메시지 출력
      setTimeout(() => {
        addCombatLog("모든 적을 물리쳤습니다!", "system");
        onCombatEnd({ victory: true, remainingHp: currentPlayerHp });
      }, 200);
      isEnded = true;
    }

    return isEnded;
  }, [currentPlayerHp, enemyState, onCombatEnd, addCombatLog]);

  // 3. 다음 턴 처리 함수
  const nextTurn = useCallback(() => {
    const isCurrentCombatEnded = checkCombatEnd();
    if (isCurrentCombatEnded) return;

    // 다음 턴 인덱스 계산
    const nextIndex = (currentTurnIndex + 1) % turnOrder.length;

    // 새로운 라운드 시작 체크는 턴 변경 전에 수행
    if (nextIndex === 0) {
      setCurrentRound((prev) => prev + 1);
      // 라운드 시작 메시지는 setCombatLog로 직접 처리하여 중복 방지
      setCombatLog((prev) => {
        const newRound = prev[prev.length - 1]?.text.includes("라운드")
          ? prev
          : [
              ...prev,
              {
                text: `라운드 ${currentRound + 1} 시작!`,
                type: "system" as const, // 타입을 명시적으로 지정
              },
            ];
        return newRound;
      });

      // 효과 갱신
      setCombatState((prev) => ({
        ...prev,
        activeEffects: prev.activeEffects
          .map((effect) => ({
            ...effect,
            duration: effect.duration - 1,
          }))
          .filter((effect) => effect.duration > 0),
        advantage: "none",
      }));
    }

    // 다음 액터 정보 가져오기
    let nextActor = turnOrder[nextIndex];

    // 죽은 적 턴 스킵
    if (!nextActor.isPlayer && typeof nextActor.enemyIndex === "number") {
      const enemy = enemyState[nextActor.enemyIndex];
      if (enemy.currentHp <= 0) {
        // 다음 살아있는 액터 찾기
        let skippedIndex = nextIndex;
        do {
          skippedIndex = (skippedIndex + 1) % turnOrder.length;
          nextActor = turnOrder[skippedIndex];
          // 플레이어이거나, 살아있는 적인 경우 중단
          if (
            nextActor.isPlayer ||
            (typeof nextActor.enemyIndex === "number" &&
              enemyState[nextActor.enemyIndex].currentHp > 0)
          ) {
            break;
          }
        } while (skippedIndex !== currentTurnIndex);

        // 모든 적이 죽었는지 다시 한번 체크
        if (checkCombatEnd()) return;
      }
    }

    // 턴 상태 업데이트
    setCurrentTurnIndex(nextIndex);
    setIsPlayerTurn(nextActor.isPlayer);
    setSelectedTarget(null);
  }, [currentTurnIndex, turnOrder, enemyState, currentRound, checkCombatEnd]);

  // 전투 이미지 생성
  const generateCombatImage = async () => {
    if (!character) return;

    setCombatImage({ url: null, loading: true });

    const enemyDescription = enemies
      .map((e) => `${e.name} (Level ${e.level})`)
      .join(" and ");

    const prompt = `
      A dramatic combat scene between a ${character.race} ${character.class} 
      facing off against ${enemyDescription} in ${dungeonName || "a dungeon"}.
      ${dungeonConcept || ""} 
      Action-packed fantasy battle scene with dynamic poses and dramatic lighting.
    `;

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();

      setCombatImage({
        url: data.imageUrl,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to generate combat image:", error);
      setCombatImage({ url: null, loading: false });
    }
  };

  // 1. 플레이어 공격 처리
  const handlePlayerAttack = useCallback(
    async (targetIndex: number) => {
      if (!isPlayerTurn || !character) return;

      const target = enemyState[targetIndex];
      if (!target || target.currentHp <= 0) return;

      // 공격 굴림
      const advantage = combatState.advantage;
      const { total: attackRoll } = await rollDiceWithAnimation(
        20,
        1,
        advantage
      );
      const strMod = Math.floor((character.stats.strength - 10) / 2);
      const profBonus = Math.floor((character.level || 1) / 4) + 2;
      const toHit = attackRoll + strMod + profBonus;

      // 명중 판정 결과 UI 업데이트
      setLastAttackRoll({
        roll: attackRoll,
        modifier: strMod + profBonus,
        total: toHit,
        type:
          attackRoll === 20 ? "critical" : attackRoll === 1 ? "miss" : "normal",
      });

      // 미스인 경우 바로 처리
      if (attackRoll === 1 || toHit < target.ac) {
        showAttackEffect("miss", 0, targetIndex);
        addCombatLog(
          `${character.name}의 공격이 ${target.name}의 방어를 뚫지 못했습니다. (${toHit} vs AC ${target.ac})`,
          "miss"
        );
        // 다음 턴으로 진행
        setIsPlayerTurn(false);
        nextTurn();
        return;
      }

      // 데미지 계산
      let totalDamage = 0;
      let damageText = "";

      try {
        const weapon = character.equipment.weapon;
        const { total: baseDamage } = weapon?.stats.damage
          ? await rollDiceWithAnimation(
              Number(weapon.stats.damage.split("d")[1]),
              Number(weapon.stats.damage.split("d")[0])
            )
          : await rollDiceWithAnimation(4, 1);

        let bonusDamage = 0;
        const isRaging = combatState.activeEffects.some((e) => e.id === "rage");
        if (isRaging && character.class.toLowerCase() === "barbarian") {
          bonusDamage = 2;
        }

        totalDamage =
          attackRoll === 20
            ? (baseDamage + bonusDamage) * 2 + strMod
            : baseDamage + bonusDamage + strMod;

        damageText =
          attackRoll === 20
            ? `치명타! ${character.name}의 강력한 공격이 ${target.name}에게 ${totalDamage}의 치명적인 피해를 입혔습니다!`
            : `${character.name}의 공격이 ${target.name}에게 ${totalDamage}의 피해를 입혔습니다.`;

        // 데미지와 효과를 동시에 적용
        let enemyDied = false;

        await Promise.all([
          new Promise<void>((resolve) => {
            setEnemyState((prev) => {
              const newState = [...prev];
              const currentHp = newState[targetIndex].currentHp;
              const newHp = Math.max(0, currentHp - totalDamage);

              newState[targetIndex] = {
                ...newState[targetIndex],
                currentHp: newHp,
              };

              if (newHp === 0 && currentHp > 0) {
                enemyDied = true;
              }

              return newState;
            });
            resolve();
          }),
          showAttackEffect("damage", totalDamage, targetIndex),
        ]);

        // 공격 로그 기록
        addCombatLog(damageText, attackRoll === 20 ? "critical" : "normal");

        // 죽음 메시지는 한 번만 출력
        if (enemyDied) {
          addCombatLog(`${target.name}이(가) 쓰러졌습니다!`, "system");

          // 모든 적이 죽었는지 확인
          const allEnemiesDead = enemyState.every((enemy, idx) => {
            // 현재 처리중인 적은 이미 죽은 것으로 처리
            if (idx === targetIndex) return true;
            return enemy.currentHp <= 0;
          });

          if (allEnemiesDead) {
            addCombatLog("모든 적을 물리쳤습니다!", "system");
            onCombatEnd({ victory: true, remainingHp: currentPlayerHp });
            return; // 전투 종료시 함수 종료
          }
        }

        // 전투가 끝나지 않았다면 다음 턴으로
        setIsPlayerTurn(false);
        nextTurn();
      } catch (error) {
        console.error("Combat error:", error);
        addCombatLog("오류가 발생했습니다.", "system");
      }
    },
    [
      isPlayerTurn,
      character,
      enemyState,
      combatState,
      showAttackEffect,
      addCombatLog,
      rollDiceWithAnimation,
      onCombatEnd,
      currentPlayerHp,
      nextTurn,
    ]
  );

  // 2. 적 공격 처리
  const handleEnemyTurn = useCallback(
    async (enemyIndex: number) => {
      const enemy = enemyState[enemyIndex];
      if (enemy.currentHp <= 0) {
        nextTurn();
        return;
      }

      // 공격 실행
      const { total: attackRoll } = rollDice(20);
      const attack =
        enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
      const toHit = attackRoll + attack.toHit;
      const playerAC = calculatePlayerAC(character);

      setLastAttackRoll({
        roll: attackRoll,
        modifier: attack.toHit,
        total: toHit,
        type:
          attackRoll === 20 ? "critical" : attackRoll === 1 ? "miss" : "normal",
      });

      // 플레이어 사망 처리 함수
      const handlePlayerDeath = () => {
        addCombatLog("플레이어가 쓰러졌습니다!", "system");
        onCombatEnd({ victory: false, remainingHp: 0 });
        return true; // 전투 종료를 나타내는 값 반환
      };

      if (attackRoll === 20) {
        const [diceCount, diceSides] = attack.damage.split("d").map(Number);
        const { total: damageRoll } = rollDice(diceSides, diceCount);
        const criticalDamage = damageRoll * 2;

        const newHp = Math.max(0, currentPlayerHp - criticalDamage);
        setCurrentPlayerHp(newHp);

        showAttackEffect("damage", criticalDamage, "player");
        addCombatLog(
          `치명타! ${enemy.name}의 ${attack.name} 공격이 플레이어에게 ${criticalDamage}의 치명적인 피해를 입혔습니다!`,
          "critical"
        );

        if (newHp <= 0) {
          return handlePlayerDeath();
        }
      } else if (toHit >= playerAC && attackRoll !== 1) {
        const [diceCount, diceSides] = attack.damage.split("d").map(Number);
        const { total: damageRoll } = rollDice(diceSides, diceCount);

        const newHp = Math.max(0, currentPlayerHp - damageRoll);
        setCurrentPlayerHp(newHp);

        showAttackEffect("damage", damageRoll, "player");
        addCombatLog(
          `${enemy.name}의 ${attack.name} 공격이 플레이어에게 ${damageRoll}의 피해를 입혔습니다.`,
          "normal"
        );

        if (newHp <= 0) {
          return handlePlayerDeath();
        }
      } else {
        showAttackEffect("miss", 0, "player");
        addCombatLog(
          `${enemy.name}의 ${attack.name} 공격이 빗나갔습니다. (${toHit} vs AC ${playerAC})`,
          "miss"
        );
      }

      // 잠시 대기 후 전투 종료 체크
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 플레이어가 살아있을 경우에만 다음 턴으로
      nextTurn();

      return false; // 전투가 계속됨을 나타냄
    },
    [
      enemyState,
      character,
      currentPlayerHp,
      rollDice,
      showAttackEffect,
      addCombatLog,
      onCombatEnd,
      nextTurn,
    ]
  );

  // 3. 전투 시작 처리
  const startCombat = useCallback(async () => {
    setCombatStarted(true);
    onCombatStart(true);

    // 이미지 생성 시도
    if (character) {
      setCombatImage({ url: null, loading: true });

      const enemyDescription = enemies
        .map((e) => `${e.name} (Level ${e.level})`)
        .join(" and ");

      const prompt = `
        A dramatic combat scene between a ${character.race} ${character.class} 
        facing off against ${enemyDescription} in ${dungeonName || "a dungeon"}.
        ${dungeonConcept || ""} 
        Action-packed fantasy battle scene with dynamic poses and dramatic lighting.
      `;

      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) throw new Error("Failed to generate image");
        const data = await response.json();

        setCombatImage({
          url: data.imageUrl,
          loading: false,
        });
      } catch (error) {
        console.error("Failed to generate combat image:", error);
        setCombatImage({ url: null, loading: false });
      }
    }

    // 전투 초기화
    const initiativeRolls: InitiativeRoll[] = [];

    // 플레이어 선제
    const playerDexMod = character
      ? Math.floor((character.stats.dexterity - 10) / 2)
      : 0;
    const playerRoll = rollDice(20).total + playerDexMod;
    initiativeRolls.push({
      name: character?.name || "Player",
      roll: playerRoll,
      isPlayer: true,
    });

    // 적 선제
    enemies.forEach((enemy, index) => {
      const enemyRoll = rollDice(20).total;
      initiativeRolls.push({
        name: enemy.name,
        roll: enemyRoll,
        isPlayer: false,
        enemyIndex: index,
      });
    });

    const sortedInitiative = initiativeRolls.sort((a, b) => b.roll - a.roll);
    const order = sortedInitiative.map(({ name, isPlayer, enemyIndex }) => ({
      name,
      isPlayer,
      enemyIndex,
    }));

    setTurnOrder(order);
    addCombatLog(
      `전투가 시작됐습니다! 선제점 순서: ${sortedInitiative
        .map((i) => `${i.name}(${i.roll})`)
        .join(", ")}`,
      "system"
    );
  }, [character, enemies, dungeonName, dungeonConcept, rollDice, addCombatLog]);

  // 1. useEffect 훅들
  useEffect(() => {
    if (combatStarted && !combatImage.url && !combatImage.loading) {
      generateCombatImage();
    }
  }, [combatStarted]);

  useEffect(() => {
    if (combatStarted && turnOrder.length > 0 && currentRound === 1) {
      // 전투 시작 시에만 한 번 출력
      addCombatLog(
        `${dungeonName || "던전"}에서 전투가 시작됐습니다!`,
        "system"
      );
      enemies.forEach((enemy) => {
        addCombatLog(`${enemy.name}이(가) 나타났습니다!`, "system");
      });
    }
  }, [
    combatStarted,
    turnOrder,
    dungeonName,
    enemies,
    currentRound,
    addCombatLog,
  ]);

  useEffect(() => {
    if (!combatStarted || !turnOrder[currentTurnIndex]) return;

    const currentTurn = turnOrder[currentTurnIndex];
    setIsPlayerTurn(currentTurn.isPlayer);

    if (!currentTurn.isPlayer && currentTurn.enemyIndex !== undefined) {
      const timeoutId = setTimeout(() => {
        handleEnemyTurn(currentTurn.enemyIndex!);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [currentTurnIndex, combatStarted, turnOrder, handleEnemyTurn]);

  // 2. 클래스별 특수 능력 초기화
  useEffect(() => {
    if (!character) return;

    const abilities: ClassAbility[] = [];

    switch (character.class.toLowerCase()) {
      case "barbarian":
        abilities.push({
          name: "전투 격노",
          description: "다음 턴까지 공격에 이점을 얻고 피해에 저항을 얻습니다.",
          type: "active",
          usesPerRound: 1,
          icon: Flame,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            advantage: "advantage",
            activeEffects: [
              ...state.activeEffects,
              {
                id: "rage",
                name: "격노",
                duration: 10,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "fighter":
        abilities.push({
          name: "행동 쇄도",
          description: "추가 공격 행동을 획득합니다.",
          type: "active",
          usesPerRound: 1,
          icon: Swords,
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "action-surge",
                name: "행동 쇄도",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        abilities.push({
          name: "치유의 기운",
          description: "체력을 회복합니다. (1d10 + 레벨)",
          type: "active",
          usesPerRound: 1,
          icon: Heart,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "second-wind",
                name: "치유의 기운",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "paladin":
        abilities.push({
          name: "신성한 강타",
          description: "추가 광휘 피해를 입힙니다. (2d8)",
          type: "active",
          icon: Sun,
          resourceCost: {
            type: "slots",
            value: 1,
          },
          conditions: {
            requiresWeapon: true,
            requiresSpellSlot: true,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "divine-smite",
                name: "신성한 강타",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        abilities.push({
          name: "신성한 감지",
          description: "주변의 강력한 선과 악을 감지합니다.",
          type: "active",
          icon: Eye,
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "divine-sense",
                name: "신성한 감지",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "rogue":
        abilities.push({
          name: "교묘한 행동",
          description:
            "은신, 질주, 후퇴, 숨기 행동을 추가 행동으로 사용합니다.",
          type: "active",
          icon: Ghost,
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "cunning-action",
                name: "교묘한 행동",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "monk":
        abilities.push({
          name: "기 폭발",
          description: "Ki 포인트를 사용하여 추가 공격을 가합니다.",
          type: "active",
          icon: Zap,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "flurry-of-blows",
                name: "기 폭발",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "wizard":
        abilities.push({
          name: "주문 회복",
          description: "소모한 주문 슬롯을 회복합니다.",
          type: "active",
          icon: Sparkles,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "arcane-recovery",
                name: "주문 회복",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "warlock":
        abilities.push({
          name: "마력 회복",
          description: "소모한 주문 슬롯을 회복합니다.",
          type: "active",
          icon: Moon,
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "pact-magic",
                name: "마력 회복",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "sorcerer":
        abilities.push({
          name: "마법 원천",
          description: "주문 슬롯을 소서리 포인트로 변환합니다.",
          type: "active",
          icon: Wand2,
          resourceCost: {
            type: "slots",
            value: 1,
          },
          conditions: {
            requiresSpellSlot: true,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "font-of-magic",
                name: "마법 원천",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "druid":
        abilities.push({
          name: "야생 변신",
          description: "동물의 형태로 변신합니다.",
          type: "active",
          icon: Leaf,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "wild-shape",
                name: "야생 변신",
                duration: 1,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "bard":
        abilities.push({
          name: "바드의 영감",
          description: "아군에게 추가 주사위를 제공합니다.",
          type: "active",
          icon: Music,
          resourceCost: {
            type: "resource",
            value: 1,
          },
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "bardic-inspiration",
                name: "바드의 영감",
                duration: 10,
                type: "buff",
              },
            ],
          }),
        });
        break;

      case "ranger":
        abilities.push({
          name: "사냥감 표시",
          description: "선택한 적에게 추가 피해를 입힙니다.",
          type: "active",
          icon: Target,
          conditions: {
            minHp: 1,
          },
          effect: (state) => ({
            ...state,
            activeEffects: [
              ...state.activeEffects,
              {
                id: "hunters-mark",
                name: "사냥감 표시",
                duration: 10,
                type: "buff",
              },
            ],
          }),
        });
        break;
    }

    setAvailableActions(abilities);
  }, [character]);

  // 3. 특수 능력 관련 유틸리티 함수들
  const checkAbilityConditions = useCallback(
    (conditions?: {
      minHp?: number;
      maxHp?: number;
      requiresWeapon?: boolean;
      requiresSpellSlot?: boolean;
    }): boolean => {
      if (!conditions) return true;
      if (!character) return false;

      if (conditions.minHp && currentPlayerHp < conditions.minHp) return false;
      if (conditions.maxHp && currentPlayerHp > conditions.maxHp) return false;
      if (conditions.requiresWeapon && !character.equipment.weapon)
        return false;
      if (conditions.requiresSpellSlot) {
        const hasAvailableSlot = character.spells.slots.some(
          (slot) => slot.total > slot.used
        );
        if (!hasAvailableSlot) return false;
      }

      return true;
    },
    [character, currentPlayerHp]
  );

  const consumeAbilityResource = useCallback(
    (ability: ClassAbility): boolean => {
      if (!ability.resourceCost) return true;
      if (!character) return false;

      switch (ability.resourceCost.type) {
        case "hp":
          if (currentPlayerHp <= ability.resourceCost.value) {
            toast({
              title: "자원 부족",
              description: "HP가 부족합니다.",
              variant: "destructive",
            });
            return false;
          }
          setCurrentPlayerHp((prev) => prev - ability.resourceCost!.value);
          return true;

        case "resource":
          if (character.resource.current < ability.resourceCost.value) {
            toast({
              title: "자원 부족",
              description: `${character.resource.name}이(가) 부족합니다.`,
              variant: "destructive",
            });
            return false;
          }
          return true;

        case "slots":
          const availableSlot = character.spells.slots.find(
            (slot) => slot.total > slot.used
          );
          if (!availableSlot) {
            toast({
              title: "자원 부족",
              description: "사용 가능한 주문 슬롯이 없습니다.",
              variant: "destructive",
            });
            return false;
          }
          return true;

        default:
          return true;
      }
    },
    [character, currentPlayerHp, toast]
  );

  const getUnavailabilityReason = useCallback(
    (conditions?: {
      minHp?: number;
      maxHp?: number;
      requiresWeapon?: boolean;
      requiresSpellSlot?: boolean;
    }): string => {
      if (!conditions) return "";
      if (!character) return "캐릭터 정보를 불러올 수 없습니다.";

      if (conditions.minHp && currentPlayerHp < conditions.minHp) {
        return "HP가 부족합니다.";
      }
      if (conditions.maxHp && currentPlayerHp > conditions.maxHp) {
        return "HP가 너무 높습니다.";
      }
      if (conditions.requiresWeapon && !character.equipment.weapon) {
        return "무기가 필요합니다.";
      }
      if (conditions.requiresSpellSlot) {
        const hasAvailableSlot = character.spells.slots.some(
          (slot) => slot.total > slot.used
        );
        if (!hasAvailableSlot) {
          return "사용 가능한 주문 슬롯이 없습니다.";
        }
      }

      return "";
    },
    [character, currentPlayerHp]
  );

  const getResourceCostText = useCallback(
    (resourceCost: {
      type: "hp" | "resource" | "slots";
      value: number;
    }): string => {
      switch (resourceCost.type) {
        case "hp":
          return `${resourceCost.value} HP`;
        case "resource":
          return `${resourceCost.value} ${character?.resource.name}`;
        case "slots":
          return `${resourceCost.value}레벨 주문 슬롯`;
        default:
          return "";
      }
    },
    [character]
  );

  const AttackButton = ({
    onClick,
    selected,
  }: {
    onClick: () => void;
    selected: boolean;
  }) => (
    <Button
      size="sm"
      onClick={onClick}
      variant={selected ? "default" : "outline"}
      className={cn("relative group", diceRolling && "pointer-events-none")}
      disabled={diceRolling}
    >
      <div className="flex items-center justify-center gap-2 w-full h-full">
        <Sword className="w-4 h-4" />
        <span>공격</span>
        <div className="flex items-center justify-center">
          {" "}
          <DiceIcon rolling={diceRolling} />
        </div>
      </div>
      {diceResult && (
        <div
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2",
            "bg-background text-foreground",
            "px-2 py-1 rounded-md shadow-md border",
            "text-sm font-bold",
            "transform transition-all duration-200",
            diceResult.rolling ? "scale-110" : "scale-100"
          )}
        >
          {diceResult.result}
        </div>
      )}
    </Button>
  );

  return (
    <div className="space-y-4">
      {!combatStarted ? (
        // 전투 시작 전 화면
        <div className="space-y-4">
          <Card className="bg-red-500/10 border-red-500/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <SkullIcon className="w-5 h-5" />
                <h3 className="font-semibold">적대적 조우!</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {enemies.length}명의 적이 등장했습니다:
                {enemies.map((e) => ` ${e.name} (Lv.${e.level})`).join(",")}
              </p>
            </CardContent>
          </Card>
          <Button onClick={startCombat} className="w-full">
            <Swords className="w-4 h-4 mr-2" />
            전투 시작
          </Button>
        </div>
      ) : (
        // 전투 진행 화면
        <div className="space-y-4">
          {/* 전투 이미지 */}
          {combatImage.loading ? (
            <Card className="aspect-video w-full bg-muted animate-pulse">
              <CardContent className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">전투 장면 생성 중...</p>
              </CardContent>
            </Card>
          ) : combatImage.url ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={combatImage.url}
                alt="Combat Scene"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {/* 현재 턴 & 라운드 정보 */}
          <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">
                {turnOrder[currentTurnIndex]?.name}의 턴
              </span>
            </div>
            <div className="text-sm font-medium px-3 py-1 bg-primary/20 rounded-full">
              Round {currentRound}
            </div>
          </div>

          {/* 플레이어 상태 */}
          <Card
            className={cn(
              "border transition-colors duration-300",
              currentPlayerHp < maxPlayerHp * 0.3
                ? "border-red-500/50 bg-red-500/5"
                : currentPlayerHp < maxPlayerHp * 0.6
                ? "border-yellow-500/50 bg-yellow-500/5"
                : "border-green-500/50 bg-green-500/5"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Heart
                      className={cn(
                        "w-5 h-5",
                        currentPlayerHp < maxPlayerHp * 0.3
                          ? "text-red-500"
                          : currentPlayerHp < maxPlayerHp * 0.6
                          ? "text-yellow-500"
                          : "text-green-500"
                      )}
                    />
                    <div>
                      <span className="font-semibold">
                        {currentPlayerHp} / {maxPlayerHp}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">
                        HP
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <span>AC {calculatePlayerAC(character)}</span>
                  </div>
                </div>
                {character && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {character.name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20">
                      Lv.{character.level} {character.class}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 적 상태 */}
          <div className="grid gap-4">
            {enemyState.map((enemy, index) => (
              <Card
                key={index}
                className={cn(
                  "transition-all duration-300 cursor-pointer",
                  enemy.currentHp <= 0 && "opacity-50",
                  selectedTarget === index && "ring-2 ring-primary",
                  isPlayerTurn && enemy.currentHp > 0 && "hover:border-primary"
                )}
                onClick={() =>
                  isPlayerTurn &&
                  enemy.currentHp > 0 &&
                  setSelectedTarget(index)
                }
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-semibold flex items-center gap-2">
                        {enemy.name}
                        {enemy.currentHp <= 0 && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-500">
                            Dead
                          </span>
                        )}
                        {enemy.status.map((status, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-primary/20"
                          >
                            {status}
                          </span>
                        ))}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>AC {enemy.ac}</span>
                        <span>•</span>
                        <span>Lv.{enemy.level}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Heart
                          className={cn(
                            "w-4 h-4",
                            enemy.currentHp < enemy.hp * 0.3
                              ? "text-red-500"
                              : enemy.currentHp < enemy.hp * 0.6
                              ? "text-yellow-500"
                              : "text-green-500"
                          )}
                        />
                        <span>
                          {enemy.currentHp} / {enemy.hp}
                        </span>
                      </div>
                      {isPlayerTurn && enemy.currentHp > 0 && (
                        <AttackButton
                          onClick={() => handlePlayerAttack(index)}
                          selected={selectedTarget === index}
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 전투 로그 */}
          <CombatLog combatLog={combatLog} />

          {/* 전투 효과 애니메이션 */}
          {combatState.effects.map((effect, index) => (
            <div
              key={index}
              className={cn(
                "absolute pointer-events-none animate-bounce text-lg font-bold",
                effect.type === "damage" && "text-red-500",
                effect.type === "heal" && "text-green-500",
                effect.type === "buff" && "text-blue-500",
                effect.type === "debuff" && "text-purple-500",
                effect.type === "miss" && "text-gray-500"
              )}
              style={{
                top:
                  effect.target === "player"
                    ? "50%"
                    : `${effect.target * 100 + 50}px`,
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {effect.text || (
                <>
                  {effect.type === "damage" && `-${effect.value}`}
                  {effect.type === "heal" && `+${effect.value}`}
                  {effect.type === "buff" && <ShieldIcon className="w-6 h-6" />}
                  {effect.type === "debuff" && <Zap className="w-6 h-6" />}
                  {effect.type === "miss" && "MISS!"}
                </>
              )}
            </div>
          ))}

          {/* 특수 능력 메뉴 */}
          {showActionMenu && (
            <Card className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <CardContent className="p-4 max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">특수 능력</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActionMenu(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid gap-2">
                  {availableActions.map((action, index) => {
                    const isAvailable = checkAbilityConditions(
                      action.conditions
                    );
                    const tooltipText = !isAvailable
                      ? getUnavailabilityReason(action.conditions)
                      : "";

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              if (!isAvailable) return;
                              if (consumeAbilityResource(action)) {
                                setCombatState(action.effect(combatState));
                                setShowActionMenu(false);
                              }
                            }}
                            className={cn(
                              "w-full justify-between p-4",
                              action.type === "active"
                                ? "bg-primary/10"
                                : "bg-muted",
                              !isAvailable && "opacity-50 cursor-not-allowed"
                            )}
                            variant="outline"
                            disabled={!isAvailable}
                          >
                            <div className="flex items-center gap-3">
                              <action.icon
                                className={cn(
                                  "w-5 h-5",
                                  action.type === "active"
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                              <div className="text-left">
                                <div className="font-medium">{action.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                            </div>
                            {action.resourceCost && (
                              <div className="text-xs text-muted-foreground">
                                {getResourceCostText(action.resourceCost)}
                              </div>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {!isAvailable && (
                          <TooltipContent>
                            <p>{tooltipText}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 마지막 공격 굴림 결과 */}
          {lastAttackRoll && (
            <div
              className={cn(
                "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg",
                lastAttackRoll.type === "critical" && "bg-red-500 text-white",
                lastAttackRoll.type === "miss" && "bg-gray-500 text-white",
                lastAttackRoll.type === "normal" && "bg-blue-500 text-white"
              )}
            >
              <div className="text-lg font-bold">
                {lastAttackRoll.roll} + {lastAttackRoll.modifier} ={" "}
                {lastAttackRoll.total}
              </div>
              <div className="text-sm">
                {lastAttackRoll.type === "critical" && "치명타!"}
                {lastAttackRoll.type === "miss" && "빗나감!"}
                {lastAttackRoll.type === "normal" && "공격 굴림"}
              </div>
            </div>
          )}

          {/* 활성화된 효과 표시 */}
          {combatState.activeEffects.length > 0 && (
            <div className="flex gap-2 mt-2">
              {combatState.activeEffects.map((effect, index) => (
                <div
                  key={index}
                  className={cn(
                    "px-2 py-1 rounded-full text-sm",
                    effect.type === "buff" && "bg-blue-500/10 text-blue-500",
                    effect.type === "debuff" && "bg-red-500/10 text-red-500"
                  )}
                >
                  {effect.name} ({effect.duration})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
