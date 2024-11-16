import { Character, DungeonState } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Boxes, Crown, DoorOpen } from "lucide-react";

interface DungeonHeaderProps {
  dungeonState: DungeonState;
  selectedCharacter: Character;
  onEscape: () => void;
  onComplete: () => void;
}

export function DungeonHeader({
  dungeonState,
  selectedCharacter,
  onEscape,
  onComplete,
}: DungeonHeaderProps) {
  const isLastStage = dungeonState.currentStage === dungeonState.maxStages - 1;
  const canComplete = isLastStage && dungeonState.stageCompleted;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1 mr-4">
          <h2 className="text-2xl font-bold">
            {dungeonState.dungeonName} - {dungeonState.currentStage + 1}/
            {dungeonState.maxStages} 스테이지
          </h2>
          <p className="text-muted-foreground line-clamp-2">
            {dungeonState.concept}
          </p>
        </div>
        {dungeonState.canEscape && (
          <Button
            variant={isLastStage ? "default" : "outline"}
            onClick={isLastStage ? onComplete : onEscape}
            className="shrink-0"
          >
            {canComplete ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                던전 완료하기
              </>
            ) : (
              <>
                <DoorOpen className="w-4 h-4 mr-2" />
                탈출하기
              </>
            )}
          </Button>
        )}
      </div>

      <Card className="bg-muted">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden">
              <img
                src={selectedCharacter.profileImage}
                alt={selectedCharacter.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-semibold">{selectedCharacter.name}</h3>
              <p className="text-sm text-muted-foreground">
                Lv.{selectedCharacter.level} {selectedCharacter.race}{" "}
                {selectedCharacter.class}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="font-semibold">{dungeonState.playerHP} HP</span>
            </div>
            {dungeonState.temporaryInventory?.length > 0 && (
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-yellow-500" />
                <span className="font-semibold">
                  {dungeonState.temporaryInventory.length}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
