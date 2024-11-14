import React from "react";
import { Shield, Skull, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DungeonLog } from "@/app/types";

const CombatResult = ({ log, maxHp }: { log: DungeonLog; maxHp: number }) => {
  if (!log.data?.combat?.resolution) return null;

  const {
    victory,
    remainingHp,
    experienceGained,
    experienceBreakdown,
    usedItems,
  } = log.data.combat.resolution;

  return (
    <Card
      className={`mt-4 ${
        victory ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* 전투 결과 헤더 */}
          <div className="flex items-center gap-3">
            {victory ? (
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Skull className="w-6 h-6 text-red-600 dark:text-red-400" />
            )}
            <div className="flex-1">
              <p
                className={`text-lg font-semibold ${
                  victory
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {victory ? "전투 승리!" : "전투 패배"}
              </p>
            </div>
          </div>

          {/* 전투 상세 정보 */}
          <div className="space-y-2 text-sm text-muted-foreground">
            {/* 처치한 적 정보 */}
            {victory && log.data?.enemies && (
              <p>
                {log.data.enemies.map((e) => e.name).join(", ")}을(를)
                처치했습니다.
              </p>
            )}

            {/* 체력 정보 */}
            <p>
              남은 체력: {remainingHp}/{maxHp}
              {victory && remainingHp < maxHp && (
                <span className="text-red-600 dark:text-red-400">
                  {` (피해량: ${maxHp - remainingHp})`}
                </span>
              )}
            </p>

            {/* 경험치 정보 */}
            {experienceGained > 0 && (
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>
                  획득 경험치: {experienceGained.toLocaleString()}
                  {experienceBreakdown && (
                    <span className="text-xs">
                      {` (기본: ${experienceBreakdown.baseXP}, 보너스: ${experienceBreakdown.bonusXP})`}
                    </span>
                  )}
                </span>
              </div>
            )}

            {/* 사용된 아이템 정보 */}
            {usedItems && usedItems.length > 0 && (
              <p>
                사용된 아이템: {usedItems.map((item) => item.name).join(", ")}
              </p>
            )}
          </div>

          {/* 패배시 안내 메시지 */}
          {!victory && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              모든 체력을 소진했습니다. 잠시 후 신전으로 이동합니다...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CombatResult;
