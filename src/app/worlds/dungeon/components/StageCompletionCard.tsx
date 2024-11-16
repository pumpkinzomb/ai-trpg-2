import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

const StageCompletionCard = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <Card className="bg-green-500/10 border-green-500/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-center gap-2 text-green-600">
          <PartyPopper className="w-6 h-6" />
          <h3 className="text-xl font-semibold">스테이지 클리어!</h3>
          <PartyPopper className="w-6 h-6" />
        </div>
        <p className="text-center text-muted-foreground">
          현재 스테이지의 모든 과제를 완료했습니다. 던전을 완료하고 보상을
          획득하세요!
        </p>
        <Button
          onClick={onComplete}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Crown className="w-4 h-4 mr-2" />
          던전 완료하기
        </Button>
      </CardContent>
    </Card>
  );
};

export default StageCompletionCard;
