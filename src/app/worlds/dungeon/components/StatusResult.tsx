import React from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DungeonLog } from "@/app/types";

interface StatusResultProps {
  log: DungeonLog;
  maxHp?: number;
}

const StatusResult: React.FC<StatusResultProps> = ({ log, maxHp }) => {
  // 전투 결과 표시
  const renderCombatResult = () => {
    if (!log.data?.combat?.resolved || !log.data.combat.resolution) return null;
    const resolution = log.data.combat.resolution;

    return (
      <Card className="bg-muted/50 mb-4">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {resolution.victory ? (
              <div className="flex items-center gap-2 text-green-500 text-lg font-medium">
                <Check className="h-5 w-5" />
                <span>전투 승리!</span>
              </div>
            ) : (
              <div className="text-red-500 text-lg font-medium">
                <span>전투 패배</span>
              </div>
            )}

            <div className="text-muted-foreground space-y-1">
              {resolution.experienceGained > 0 && (
                <p>획득 경험치: {resolution.experienceGained}</p>
              )}
              {resolution.remainingHp !== undefined && maxHp && (
                <p>
                  남은 체력: {resolution.remainingHp} / {maxHp}
                </p>
              )}
              {resolution.usedItems.length > 0 && (
                <p>사용한 아이템: {resolution.usedItems.length}개</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 함정 결과 표시
  const renderTrapResult = () => {
    if (!log.data?.trap?.resolved || !log.data.trap.resolution) return null;
    const resolution = log.data.trap.resolution;

    return (
      <Card className="bg-muted/50 mb-4">
        <CardContent className="pt-6">
          <div className="space-y-2">
            {resolution.success ? (
              <div className="flex items-center gap-2 text-green-500 text-lg font-medium">
                <Check className="h-5 w-5" />
                <span>함정 회피 성공!</span>
              </div>
            ) : (
              <div className="text-red-500 text-lg font-medium">
                <span>❌ 함정 회피 실패</span>
              </div>
            )}

            <div className="text-muted-foreground space-y-1">
              <p>주사위 굴림: {resolution.roll}</p>
              {!resolution.success && resolution.damage && (
                <p>받은 피해: {resolution.damage}</p>
              )}
              {resolution.description && (
                <p className="text-sm">{resolution.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderTrapResult()}
      {renderCombatResult()}
    </div>
  );
};

export default StatusResult;
