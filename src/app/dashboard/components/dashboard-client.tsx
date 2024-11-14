"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Map,
  Hammer,
  Coffee,
  History,
  Trophy,
  Skull,
  Flag,
  ArrowRight,
  Heart,
  Flame,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DungeonLogDialog } from "./DungeonLogDialog";
import { LucideIcon } from "lucide-react";
import { Character } from "@/app/types";
import CharacterSkeleton from "./CharacterSkeleton";
import ActivitySkeleton from "./ActivitySkeleton";

const getStatusIcon = (status: any) => {
  if (status.dungeon.isActive) return Map;
  if (status.labor.isActive) return Hammer;
  return Coffee;
};

const getStatusText = (status: any) => {
  if (status.dungeon.isActive) return "던전 탐험 중";
  if (status.labor.isActive) return "노역 중";
  return "휴식 중";
};

const getStatusColor = (status: any) => {
  if (status.dungeon.isActive) return "text-blue-500";
  if (status.labor.isActive) return "text-orange-500";
  return "text-green-500";
};

const CharacterStatusBar = ({
  label,
  current,
  max,
  icon: Icon = Flame, // 기본 아이콘으로 Flame 사용
  color = "text-blue-500", // 기본 색상 지정
}: CharacterStatusBarProps) => (
  <div className="flex items-center gap-2">
    <div className="flex items-center gap-1 min-w-[120px]">
      <Icon className={cn("w-4 h-4", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <Progress
      value={(current / max) * 100}
      className={cn("h-2 flex-1", color)}
    />
    <span className="text-xs text-muted-foreground min-w-[60px] text-right">
      {current}/{max}
    </span>
  </div>
);

interface DungeonActivity {
  _id: string;
  characterName: string;
  characterProfileImage: string;
  dungeonName: string;
  currentStage: number;
  maxStages: number;
  status: "active" | "completed" | "failed";
  completedAt: string;
  rewards?: {
    xp: number;
    gold: number;
  };
}

interface CharacterStatusBarProps {
  label: string;
  current: number;
  max: number;
  icon?: LucideIcon;
  color?: string;
}

interface DashboardResponse {
  characters: Character[];
  recentActivity: DungeonActivity[];
  hasMore: boolean;
  total: number;
}

interface ActivitiesResponse {
  activities: DungeonActivity[];
  hasMore: boolean;
  total: number;
  currentPage: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DashboardClient() {
  const [page, setPage] = useState(1);
  const {
    data: initialData,
    error: initialError,
    isLoading: initialLoading,
  } = useSWR<DashboardResponse>("/api/dashboard", fetcher);

  const {
    data: additionalData,
    error: additionalError,
    isLoading: additionalLoading,
  } = useSWR<ActivitiesResponse>(
    initialData && page > 1
      ? `/api/dashboard/activities?page=${page}&pageSize=5`
      : null,
    fetcher
  );

  console.log("additionalData", additionalData);

  const [selectedDungeon, setSelectedDungeon] = useState<{
    _id: string;
    characterName: string;
    dungeonName: string;
    currentStage: number;
    maxStages: number;
    status: "completed" | "failed";
    rewards?: {
      xp: number;
      gold: number;
    };
  } | null>(null);

  const allActivities = [
    ...(initialData?.recentActivity || []),
    ...(additionalData?.activities || []),
  ];

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  const handleDungeonClick = (activity: DungeonActivity) => {
    // active 상태의 던전은 로그 다이얼로그를 열지 않음
    if (activity.status === "active") return;

    setSelectedDungeon({
      _id: activity._id,
      characterName: activity.characterName,
      dungeonName: activity.dungeonName,
      currentStage: activity.currentStage,
      maxStages: activity.maxStages,
      status: activity.status as "completed" | "failed",
      rewards: activity.rewards,
    });
  };

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>캐릭터 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2].map((i) => (
              <CharacterSkeleton key={i} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              최근 던전 활동
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <ActivitySkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMore = page === 1 ? initialData?.hasMore : additionalData?.hasMore;

  if (initialError) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-6 text-center text-destructive">
          데이터를 불러오는데 실패했습니다.
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 캐릭터 목록 (기존 코드) */}
      <Card>
        <CardHeader>
          <CardTitle>캐릭터 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {initialData?.characters.map((char: any) => {
              const StatusIcon = getStatusIcon(char.currentStatus);
              const statusColor = getStatusColor(char.currentStatus);

              return (
                <Card key={char._id} className="p-4">
                  {/* 기존 캐릭터 카드 내용... */}
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="relative w-16 h-16">
                        <img
                          src={char.profileImage}
                          alt={char.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                        <Badge
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background"
                          variant="outline"
                        >
                          Lv.{char.level}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{char.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {char.race} {char.class}
                          </p>
                        </div>

                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
                            statusColor
                          )}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {getStatusText(char.currentStatus)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <CharacterStatusBar
                          label="HP"
                          current={char.hp.current}
                          max={char.hp.max}
                          icon={Heart}
                          color="text-red-500"
                        />
                        <CharacterStatusBar
                          label={char.resource.name}
                          current={char.resource.current}
                          max={char.resource.max}
                        />
                      </div>

                      {char.activeDungeon && (
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {char.activeDungeon.dungeonName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            진행도: {char.activeDungeon.currentStage + 1}/
                            {char.activeDungeon.maxStages}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 최근 던전 활동 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            최근 던전 활동
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allActivities.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleDungeonClick(activity)}
              >
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      activity.status === "completed"
                        ? "bg-green-100 dark:bg-green-900/20"
                        : "bg-red-100 dark:bg-red-900/20"
                    )}
                  >
                    {activity.status === "completed" ? (
                      <Trophy className="w-5 h-5 text-green-500" />
                    ) : (
                      <Skull className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={activity.characterProfileImage}
                        alt={activity.characterName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="font-medium truncate">
                        {activity.characterName}
                      </span>
                    </div>
                    <span className="text-muted-foreground">·</span>
                    <span className="font-medium text-muted-foreground truncate">
                      {activity.dungeonName}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      스테이지 {activity.currentStage + 1} /{" "}
                      {activity.maxStages}
                    </span>
                  </div>
                </div>

                <div className="flex-shrink-0 flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {activity.completedAt
                      ? new Date(activity.completedAt).toLocaleDateString()
                      : "-"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDungeonClick(activity);
                    }}
                  >
                    자세히 보기
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}

            {/* 더보기 버튼 */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={additionalLoading}
                >
                  {additionalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      로딩중...
                    </>
                  ) : (
                    "더 보기"
                  )}
                </Button>
              </div>
            )}

            {/* 추가 데이터 로딩 상태 */}
            {additionalLoading && (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <ActivitySkeleton key={`additional-${i}`} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <DungeonLogDialog
        open={!!selectedDungeon}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDungeon(null);
          }
        }}
        dungeonId={selectedDungeon?._id ?? null}
        initialData={selectedDungeon}
      />
    </div>
  );
}
