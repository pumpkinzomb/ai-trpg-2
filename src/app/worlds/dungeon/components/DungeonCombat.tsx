import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Swords, Shield, Clock } from "lucide-react";
import { Character } from "@/app/types";

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
  character?: Character;
  onCombatEnd: (result: { victory: boolean; remainingHp: number }) => void;
}

type InitiativeRoll = {
  name: string;
  roll: number;
  isPlayer: boolean;
  enemyIndex?: number;
};

export default function DungeonCombat({
  enemies,
  playerHp,
  character,
  onCombatEnd,
}: DungeonCombatProps) {
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [turnOrder, setTurnOrder] = useState<
    {
      name: string;
      isPlayer: boolean;
      enemyIndex?: number;
    }[]
  >([]);
  const [enemyState, setEnemyState] = useState(
    enemies.map((enemy) => ({
      ...enemy,
      currentHp: enemy.hp,
    }))
  );
  const [currentPlayerHp, setCurrentPlayerHp] = useState(playerHp);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [combatStarted, setCombatStarted] = useState(false);

  // D&D 주사위 굴리기 함수
  const rollDice = (sides: number, count: number = 1) => {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  };

  // 전투 시작 및 선제 굴림
  const startCombat = () => {
    const initiativeRolls: InitiativeRoll[] = [];

    // 플레이어의 선제
    const playerDexMod = character
      ? Math.floor((character.stats.dexterity - 10) / 2)
      : 0;
    const playerRoll = rollDice(20) + playerDexMod;
    initiativeRolls.push({
      name: character?.name || "Player",
      roll: playerRoll,
      isPlayer: true,
    });

    // 적들의 선제
    enemies.forEach((enemy, index) => {
      const enemyRoll = rollDice(20);
      initiativeRolls.push({
        name: enemy.name,
        roll: enemyRoll,
        isPlayer: false,
        enemyIndex: index,
      });
    });

    // 선제 순서 정렬 (높은 값이 먼저)
    const sortedInitiative = initiativeRolls.sort((a, b) => b.roll - a.roll);

    // 턴 순서 설정
    const order = sortedInitiative.map(({ name, isPlayer, enemyIndex }) => ({
      name,
      isPlayer,
      enemyIndex,
    }));
    setTurnOrder(order);

    setCombatLog([
      `전투가 시작됐습니다! 선제점 순서: ${sortedInitiative
        .map((i) => `${i.name}(${i.roll})`)
        .join(", ")}`,
    ]);
    setCombatStarted(true);
  };

  // 다음 턴으로 진행
  const nextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % turnOrder.length);
  };

  // 플레이어의 AC 계산 함수
  const calculatePlayerAC = (character?: Character) => {
    if (!character) return 10; // 기본 AC

    const dexMod = Math.floor((character.stats.dexterity - 10) / 2);
    let baseAC = 10;
    let maxDexBonus = Infinity;
    let armorBonus = 0;
    let shieldBonus = 0;

    // 방어구 체크
    if (character.equipment.armor) {
      const armor = character.equipment.armor;
      armorBonus = armor.stats.defense || 0;

      // D&D 규칙에 따른 방어구 타입별 처리
      switch (armor.type) {
        case "light-armor":
          baseAC = armorBonus;
          // 민첩 수정치 전체 적용
          break;
        case "medium-armor":
          baseAC = armorBonus;
          maxDexBonus = 2; // 중형 방어구는 민첩 보너스 최대 +2
          break;
        case "heavy-armor":
          baseAC = armorBonus;
          maxDexBonus = 0; // 중형 방어구는 민첩 보너스 없음
          break;
      }
    }

    // 방패 보너스
    if (character.equipment.shield) {
      shieldBonus = character.equipment.shield.stats.defense || 0;
    }

    // 최종 AC 계산
    const finalDexBonus = Math.min(dexMod, maxDexBonus);
    const totalAC = baseAC + finalDexBonus + shieldBonus;

    return totalAC;
  };

  // 플레이어 공격 함수 수정
  const handlePlayerAttack = (targetIndex: number) => {
    if (!isPlayerTurn) return;

    const target = enemyState[targetIndex];
    if (!target) return;

    const attackRoll = rollDice(20);
    const strMod = character
      ? Math.floor((character.stats.strength - 10) / 2)
      : 2;
    const profBonus = Math.floor((character?.level || 1) / 4) + 2;
    const toHit = attackRoll + strMod + profBonus;

    // 무기 데미지 계산
    const getWeaponDamage = () => {
      if (character?.equipment.weapon?.stats.damage) {
        const [diceCount, diceSides] = character.equipment.weapon.stats.damage
          .split("d")
          .map(Number);
        return rollDice(diceSides, diceCount) + strMod;
      }
      return rollDice(4) + strMod; // 맨손 공격
    };

    if (attackRoll === 20) {
      // 치명타!
      const damage = getWeaponDamage() * 2;
      const newEnemyState = [...enemyState];
      newEnemyState[targetIndex].currentHp = Math.max(
        0,
        target.currentHp - damage
      );
      setEnemyState(newEnemyState);
      setCombatLog((prev) => [
        ...prev,
        `치명타! ${target.name}에게 ${damage}의 피해를 입혔습니다!`,
      ]);
    } else if (toHit >= target.ac) {
      // 일반 공격 성공
      const damage = getWeaponDamage();
      const newEnemyState = [...enemyState];
      newEnemyState[targetIndex].currentHp = Math.max(
        0,
        target.currentHp - damage
      );
      setEnemyState(newEnemyState);
      setCombatLog((prev) => [
        ...prev,
        `${target.name}에게 ${damage}의 피해를 입혔습니다.`,
      ]);
    } else {
      setCombatLog((prev) => [
        ...prev,
        `${target.name}을(를) 공격했지만 빗나갔습니다.`,
      ]);
    }

    setIsPlayerTurn(false);

    nextTurn();
  };

  // 현재 턴 캐릭터의 행동 처리
  useEffect(() => {
    if (
      !combatStarted ||
      currentPlayerHp <= 0 ||
      enemyState.every((e) => e.currentHp <= 0)
    )
      return;

    const currentTurn = turnOrder[currentTurnIndex];
    if (!currentTurn) return;

    if (currentTurn.isPlayer) {
      // 플레이어 턴
      setIsPlayerTurn(true);
      setCombatLog((prev) => [...prev, `${currentTurn.name}의 턴입니다.`]);
    } else {
      // 적 턴
      setIsPlayerTurn(false);
      const enemy = enemyState[currentTurn.enemyIndex!];

      if (enemy && enemy.currentHp > 0) {
        setTimeout(() => {
          const playerAC = calculatePlayerAC(character);
          const attack =
            enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
          const attackRoll = rollDice(20);
          const toHit = attackRoll + attack.toHit;

          if (attackRoll === 20) {
            const [diceCount, diceSides] = attack.damage.split("d").map(Number);
            const damage = rollDice(diceSides, diceCount) * 2;
            setCurrentPlayerHp((prev) => Math.max(0, prev - damage));
            setCombatLog((prev) => [
              ...prev,
              `치명타! ${enemy.name}가 ${attack.name}으로 ${damage}의 피해를 입혔습니다!`,
            ]);
          } else if (toHit >= playerAC) {
            const [diceCount, diceSides] = attack.damage.split("d").map(Number);
            const damage = rollDice(diceSides, diceCount);
            setCurrentPlayerHp((prev) => Math.max(0, prev - damage));
            setCombatLog((prev) => [
              ...prev,
              `${enemy.name}가 ${attack.name}으로 ${damage}의 피해를 입혔습니다.`,
            ]);
          } else {
            setCombatLog((prev) => [
              ...prev,
              `${enemy.name}의 공격이 빗나갔습니다.`,
            ]);
          }
          nextTurn();
        }, 1000);
      } else {
        nextTurn(); // 죽은 적의 턴은 스킵
      }
    }
  }, [currentTurnIndex, combatStarted, turnOrder]);

  // 적 공격 로직 수정
  useEffect(() => {
    if (!isPlayerTurn && combatStarted) {
      const enemyAttack = async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 딜레이

        const playerAC = calculatePlayerAC(character);

        enemyState.forEach((enemy) => {
          if (enemy.currentHp > 0) {
            const attack =
              enemy.attacks[Math.floor(Math.random() * enemy.attacks.length)];
            const attackRoll = rollDice(20);
            const toHit = attackRoll + attack.toHit;

            if (attackRoll === 20) {
              // 치명타!
              const [diceCount, diceSides] = attack.damage
                .split("d")
                .map(Number);
              const damage = rollDice(diceSides, diceCount) * 2;
              setCurrentPlayerHp((prev) => Math.max(0, prev - damage));
              setCombatLog((prev) => [
                ...prev,
                `치명타! ${enemy.name}가 ${attack.name}으로 ${damage}의 피해를 입혔습니다!`,
              ]);
            } else if (toHit >= playerAC) {
              const [diceCount, diceSides] = attack.damage
                .split("d")
                .map(Number);
              const damage = rollDice(diceSides, diceCount);
              setCurrentPlayerHp((prev) => Math.max(0, prev - damage));
              setCombatLog((prev) => [
                ...prev,
                `${enemy.name}가 ${attack.name}으로 ${damage}의 피해를 입혔습니다.`,
              ]);
            } else {
              setCombatLog((prev) => [
                ...prev,
                `${enemy.name}의 공격이 빗나갔습니다.`,
              ]);
            }
          }
        });

        setIsPlayerTurn(true);
      };

      enemyAttack();
    }
  }, [isPlayerTurn, enemyState, combatStarted]);

  // 전투 종료 체크
  useEffect(() => {
    if (combatStarted) {
      if (currentPlayerHp <= 0) {
        onCombatEnd({ victory: false, remainingHp: 0 });
        setCombatLog((prev) => [...prev, "전투에서 패배했습니다..."]);
      } else if (enemyState.every((enemy) => enemy.currentHp <= 0)) {
        onCombatEnd({ victory: true, remainingHp: currentPlayerHp });
        setCombatLog((prev) => [...prev, "전투에서 승리했습니다!"]);
      }
    }
  }, [currentPlayerHp, enemyState, combatStarted]);

  return (
    <div className="space-y-4">
      {!combatStarted ? (
        <Button onClick={startCombat} className="w-full">
          <Swords className="w-4 h-4 mr-2" />
          전투 시작
        </Button>
      ) : (
        <>
          {/* 현재 턴 표시 */}
          <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">
                {turnOrder[currentTurnIndex]?.name}의 턴
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              라운드 {Math.floor(currentTurnIndex / turnOrder.length) + 1}
            </div>
          </div>

          {/* 플레이어 상태 */}
          <div className="flex items-center justify-between bg-accent/50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-semibold">
                {currentPlayerHp} / {playerHp} HP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span>AC {calculatePlayerAC(character)}</span>
            </div>
          </div>

          {/* 적 상태 */}
          <div className="grid gap-4">
            {enemyState.map((enemy, index) => (
              <Card
                key={index}
                className={enemy.currentHp <= 0 ? "opacity-50" : ""}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{enemy.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        AC {enemy.ac} | Lv.{enemy.level}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>
                          {enemy.currentHp} / {enemy.hp}
                        </span>
                      </div>
                      {isPlayerTurn && enemy.currentHp > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handlePlayerAttack(index)}
                          variant="outline"
                        >
                          공격
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 전투 로그 */}
          <Card className="bg-muted/50">
            <CardContent className="p-4 h-40 overflow-y-auto">
              {combatLog.map((log, index) => (
                <p key={index} className="text-sm mb-1">
                  {log}
                </p>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
