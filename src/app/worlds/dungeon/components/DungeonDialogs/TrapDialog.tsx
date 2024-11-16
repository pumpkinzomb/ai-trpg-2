import React from "react";
import { useState, useEffect } from "react";
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

interface TrapOutcomes {
  success: {
    description: string;
  };
  failure: {
    description: string;
  };
}

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

  // dialog가 열리면 자동으로 주사위 굴리기 시작
  useEffect(() => {
    if (open && !isRolling && !result) {
      setIsRolling(true);
    }
  }, [open]);

  const handleRollComplete = async (roll: number) => {
    const finalRoll = roll + abilityModifier;
    const success = finalRoll >= trap.dc;

    const potentialDamage = Math.abs(effects.hpChange);
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

    await onResolutionComplete({
      success,
      roll: finalRoll,
      damage,
      description: rollResult.description,
    });
  };

  const getAbilityTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      dexterity: "민첩",
      strength: "근력",
      constitution: "건강",
      intelligence: "지능",
      wisdom: "지혜",
    };
    return typeMap[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>함정 판정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">
                  {getAbilityTypeName(trap.type)} 판정
                </h3>
                <p className="text-sm text-muted-foreground">
                  DC {trap.dc} (수정치: {abilityModifier})
                </p>
              </div>
              {isRolling ? (
                <DiceRoll
                  isRolling={isRolling}
                  onRollEnd={handleRollComplete}
                />
              ) : result ? (
                <div className="space-y-2">
                  <p>기본 굴림: {result.baseDice}</p>
                  <p>최종 판정: {result.roll}</p>
                  <p
                    className={
                      result.success ? "text-green-600" : "text-red-600"
                    }
                  >
                    {result.success ? "성공!" : "실패..."}
                  </p>
                  {result.damage > 0 && (
                    <p className="text-red-600">피해량: {result.damage}</p>
                  )}
                  <p className="mt-2">{result.description}</p>
                </div>
              ) : null}
            </div>
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
