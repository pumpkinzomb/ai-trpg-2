import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DiceRoll } from "./DiceRoll";

interface RewardResult {
  reward: number;
  experience: number;
  description: string;
  type: "critical" | "verygood" | "good" | "normal" | "bad" | "fail";
}

interface RewardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseReward: number;
  onCollectAndRest: (reward: number, experience: number) => void;
  onCollectAndContinue: (reward: number, experience: number) => void;
}

export function RewardDialog({
  open,
  onOpenChange,
  baseReward,
  onCollectAndRest,
  onCollectAndContinue,
}: RewardDialogProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [rewardResult, setRewardResult] = useState<RewardResult | null>(null);

  const calculateFinalReward = (
    baseReward: number,
    diceRoll: number
  ): RewardResult => {
    const baseExp = Math.floor(baseReward * 0.1); // 기본 경험치는 보상의 10%

    if (diceRoll === 20)
      return {
        reward: baseReward * 2,
        experience: baseExp * 2, // 경험치도 2배
        description: "대성공! 보상과 경험치가 2배가 됩니다!",
        type: "critical",
      };
    if (diceRoll === 1)
      return {
        reward: 0,
        experience: 0, // 경험치도 없음
        description: "대실패... 모든 보상을 잃었습니다!",
        type: "fail",
      };
    if (diceRoll >= 18)
      return {
        reward: Math.floor(baseReward * 1.5),
        experience: Math.floor(baseExp * 1.5), // 경험치 1.5배
        description: "매우 성공적! 보상과 경험치가 1.5배가 됩니다!",
        type: "verygood",
      };
    if (diceRoll >= 15)
      return {
        reward: Math.floor(baseReward * 1.25),
        experience: Math.floor(baseExp * 1.25), // 경험치 1.25배
        description: "성공적! 보상과 경험치가 1.25배가 됩니다!",
        type: "good",
      };
    if (diceRoll <= 3)
      return {
        reward: Math.floor(baseReward * 0.75),
        experience: Math.floor(baseExp * 0.75), // 경험치 75%
        description: "실패... 보상과 경험치가 75%가 됩니다.",
        type: "bad",
      };
    return {
      reward: baseReward,
      experience: baseExp,
      description: "평범한 결과입니다.",
      type: "normal",
    };
  };

  const handleRollStart = () => {
    setIsRolling(true);
  };

  const handleRollEnd = (result: number) => {
    setRollResult(result);
    setIsRolling(false);

    // calculateFinalReward 함수를 사용하여 결과 계산
    const rewardResult = calculateFinalReward(baseReward, result);
    setRewardResult(rewardResult);
  };

  const getRewardResultColor = (type: RewardResult["type"]) => {
    switch (type) {
      case "critical":
        return "text-purple-500 font-bold";
      case "verygood":
        return "text-yellow-500 font-bold";
      case "good":
        return "text-green-500";
      case "normal":
        return "text-blue-500";
      case "bad":
        return "text-orange-500";
      case "fail":
        return "text-red-500 font-bold";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>노역 보상 수령</DialogTitle>
          <DialogDescription>
            주사위를 굴려 보상을 결정하세요. 운이 좋다면 최대 2배의 보상을 받을
            수 있습니다!
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <DiceRoll isRolling={isRolling} onRollEnd={handleRollEnd} />
          {!isRolling && !rollResult && (
            <Button className="w-full mt-4" onClick={handleRollStart}>
              주사위 굴리기
            </Button>
          )}
          {rollResult && rewardResult && (
            <div className="space-y-4 mt-4">
              <div className="text-center space-y-2">
                <p className="text-lg mb-1">
                  주사위 결과: <span className="font-bold">{rollResult}</span>
                </p>
                <p
                  className={`text-lg ${getRewardResultColor(
                    rewardResult.type
                  )}`}
                >
                  {rewardResult.description}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {rewardResult.reward} Gold
                </p>
              </div>
              <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() =>
                    onCollectAndRest(
                      rewardResult.reward,
                      rewardResult.experience
                    )
                  }
                >
                  수령하고 휴식
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() =>
                    onCollectAndContinue(
                      rewardResult.reward,
                      rewardResult.experience
                    )
                  }
                >
                  수령하고 계속하기
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
