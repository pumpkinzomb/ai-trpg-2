import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sword } from "lucide-react";
import { cn } from "@/lib/utils";

const AttackButton = ({
  onClick,
  selected,
  targetIndex,
  diceRolling,
  selectedTarget,
  lastAttackRoll,
}: {
  onClick: () => void;
  selected: boolean;
  targetIndex: number;
  diceRolling: boolean;
  selectedTarget: number | null;
  lastAttackRoll: {
    roll: number;
    modifier: number;
    total: number;
    type: string;
  } | null;
}) => {
  const [animatedValue, setAnimatedValue] = useState<number | null>(null);

  useEffect(() => {
    if (diceRolling && selectedTarget === targetIndex) {
      const interval = setInterval(() => {
        setAnimatedValue(Math.floor(Math.random() * 20) + 1);
      }, 50);

      return () => {
        clearInterval(interval);
        setAnimatedValue(null);
      };
    }
  }, [diceRolling, selectedTarget, targetIndex]);

  return (
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
      </div>
      {(animatedValue ||
        (lastAttackRoll && selectedTarget === targetIndex)) && (
        <div
          className={cn(
            "absolute -top-8 left-1/2 -translate-x-1/2",
            "bg-background text-foreground",
            "px-2 py-1 rounded-md shadow-md border",
            "text-sm font-bold",
            "transform transition-all duration-200",
            diceRolling ? "scale-110" : "scale-100"
          )}
        >
          {diceRolling ? animatedValue : lastAttackRoll?.total}
        </div>
      )}
    </Button>
  );
};

export default AttackButton;
