import React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DiceRoll } from "@/components/DiceRoll";
import { Card } from "@/components/ui/card";

export interface TrapResolution {
  success: boolean;
  roll: number;
  damage: number;
  description: string;
}

// 함정의 결과 설명을 위한 타입
interface TrapOutcomes {
  success: {
    description: string;
  };
  failure: {
    description: string;
  };
}

// 함정의 기본 정보를 나타내는 타입
interface Trap {
  type: "dexterity" | "strength" | "constitution" | "intelligence" | "wisdom";
  dc: number;
  outcomes: TrapOutcomes;
  resolved?: boolean;
  resolution?: TrapResolution;
}

interface TrapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  effects: {
    hpChange: number;
    stageProgress: boolean;
  };
  trap: Trap;
  abilityModifier: number;
  onResolutionComplete: (result: TrapResolution) => Promise<void>;
}

interface RollResult {
  success: boolean;
  roll: number;
  baseDice: number;
  damage: number;
  description: string;
}

export function TrapDialog({
  open,
  onOpenChange,
  trap,
  effects,
  abilityModifier,
  onResolutionComplete,
}: TrapDialogProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<RollResult | null>(null);

  const handleRollComplete = async (roll: number) => {
    const finalRoll = roll + abilityModifier;
    const success = finalRoll >= trap.dc;

    // hpChange가 음수일 때만 데미지로 간주
    const potentialDamage = Math.abs(effects.hpChange);
    // 성공시 데미지 0, 실패시 전체 데미지
    const damage = success ? 0 : potentialDamage;

    const rollResult: RollResult = {
      success,
      roll: finalRoll,
      baseDice: roll,
      damage,
      description: success
        ? trap.outcomes.success.description
        : trap.outcomes.failure.description,
    };

    setResult(rollResult);
    setIsRolling(false);

    // 결과 처리
    await onResolutionComplete({
      success,
      roll: finalRoll,
      damage,
      description: rollResult.description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>함정 발견!</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4">
            <h3 className="font-medium mb-2">
              {trap.type === "dexterity" && "민첩"}
              {trap.type === "strength" && "근력"}
              {trap.type === "constitution" && "건강"}
              {trap.type === "intelligence" && "지능"}
              {trap.type === "wisdom" && "지혜"} 판정
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              DC {trap.dc} (수정치: {abilityModifier})
            </p>
            {!result && (
              <div className="space-y-4">
                {!isRolling ? (
                  <Button
                    onClick={() => setIsRolling(true)}
                    className="w-full"
                    variant="outline"
                  >
                    주사위 굴리기
                  </Button>
                ) : (
                  <DiceRoll
                    isRolling={isRolling}
                    onRollEnd={handleRollComplete}
                  />
                )}
              </div>
            )}
            {result && (
              <div className="space-y-2">
                <p>기본 굴림: {result.baseDice}</p>
                <p>최종 판정: {result.roll}</p>
                <p
                  className={result.success ? "text-green-600" : "text-red-600"}
                >
                  {result.success ? "성공!" : "실패..."}
                </p>
                {result.damage > 0 && (
                  <p className="text-red-600">피해량: {result.damage}</p>
                )}
                <p className="mt-2">{result.description}</p>
              </div>
            )}
          </Card>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={!result}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
