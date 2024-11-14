import React from "react";
import { Dices } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const TrapDiscoveryCard = ({
  onRollDice,
}: {
  onRollDice: () => void;
}) => {
  return (
    <Card className="bg-yellow-50 dark:bg-yellow-950">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-amber-600 dark:text-amber-400">
            함정이 발견되었습니다! 회피 판정이 필요합니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRollDice}
            className="bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 border-amber-200 dark:border-amber-700"
          >
            <Dices className="w-4 h-4 mr-2" />
            주사위 굴리기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
