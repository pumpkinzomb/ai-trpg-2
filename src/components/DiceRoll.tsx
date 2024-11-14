import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";

interface DiceRollProps {
  onRollEnd: (result: number) => void;
  isRolling: boolean;
}

export function DiceRoll({ onRollEnd, isRolling }: DiceRollProps) {
  const [currentDice, setCurrentDice] = useState(1);
  const [rollResult, setRollResult] = useState<number | null>(null);

  const DiceIcons = {
    1: Dice1,
    2: Dice2,
    3: Dice3,
    4: Dice4,
    5: Dice5,
    6: Dice6,
  };

  useEffect(() => {
    let rollInterval: NodeJS.Timeout;
    let rollTimeout: NodeJS.Timeout;

    if (isRolling) {
      setRollResult(null);
      // 빠르게 주사위 변경
      rollInterval = setInterval(() => {
        setCurrentDice((prev) => (prev % 6) + 1);
      }, 200);

      // 3초 후 결과 보여주기
      rollTimeout = setTimeout(() => {
        clearInterval(rollInterval);
        const result = Math.floor(Math.random() * 20) + 1; // 1-20
        setRollResult(result);
        onRollEnd(result);
      }, 3000);
    }

    return () => {
      clearInterval(rollInterval);
      clearTimeout(rollTimeout);
    };
  }, [isRolling, onRollEnd]);

  const CurrentDiceIcon = DiceIcons[currentDice as keyof typeof DiceIcons];

  return (
    <Card className="relative w-32 h-32 mx-auto bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={isRolling ? "rolling" : "result"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isRolling ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <CurrentDiceIcon className="w-16 h-16 text-primary" />
            </motion.div>
          ) : (
            <div className="text-2xl font-bold text-primary">
              {rollResult !== null && `${rollResult}`}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
