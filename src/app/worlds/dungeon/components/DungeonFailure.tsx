import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Church, Loader2, Skull } from "lucide-react";

interface DungeonFailureProps {
  onMoveToTemple: () => Promise<void>;
}

const DungeonFailure = ({ onMoveToTemple }: DungeonFailureProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTempleMove = async () => {
    setIsLoading(true);
    await onMoveToTemple();
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <Skull className="h-6 w-6" />
            던전 탐험 실패
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            치명적인 피해를 입어 의식을 잃었습니다... 신전에서 치료가
            필요합니다.
          </p>
          <Button
            onClick={handleTempleMove}
            className="w-full"
            variant="destructive"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                신전으로 이동 중...
              </>
            ) : (
              <>
                <Church className="mr-2 h-4 w-4" />
                신전으로 이동
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DungeonFailure;
