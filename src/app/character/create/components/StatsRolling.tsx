import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dices,
  RotateCcw,
  Hand,
  Brain,
  Heart,
  Smile,
  Sword,
  Eye,
} from "lucide-react";

const abilityStats = [
  {
    name: "Strength",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Sword className="w-5 h-5" />,
    description: "자연스러운 운동 능력, 신체적 힘, 물리적인 강도",
  },
  {
    name: "Dexterity",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Hand className="w-5 h-5" />,
    description: "민첩성, 반사 신경, 균형 감각, 손-눈 협응력",
  },
  {
    name: "Constitution",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Heart className="w-5 h-5" />,
    description: "건강, 지구력, 생명력",
  },
  {
    name: "Intelligence",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Brain className="w-5 h-5" />,
    description: "정신적 예리함, 기억력, 분석 능력",
  },
  {
    name: "Wisdom",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Eye className="w-5 h-5" />,
    description: "인지력, 직관력, 의지력",
  },
  {
    name: "Charisma",
    value: 0,
    modifier: 0,
    rolls: [],
    icon: <Smile className="w-5 h-5" />,
    description: "개성의 힘, 설득력, 리더십",
  },
];

function getStatAffects(statName: string): string {
  const affects: Record<string, string> = {
    Strength: "근접 공격, 근력 판정, 운동, 짐 운반량",
    Dexterity: "원거리 공격, 민첩성 판정, 곡예, 은신, 민첩 내성, 기본 방어도",
    Constitution: "생명력, 집중 판정, 체력 내성, 피로도 저항",
    Intelligence: "비전, 역사, 조사, 자연, 종교 판정, 주문 시전(마법사)",
    Wisdom: "감지, 통찰, 의학, 생존, 동물 조련, 주문 시전(클레릭/드루이드)",
    Charisma: "기만, 협박, 공연, 설득, 주문 시전(바드/소서러/워락)",
  };

  return affects[statName] || "";
}

interface Stat {
  name: string;
  value: number;
  modifier: number;
  rolls?: number[];
  icon: React.ReactNode;
  description: string;
}

interface StatRollingProps {
  onComplete?: (
    stats: Record<string, { value: number; modifier: number }>
  ) => void;
}

const StatRolling: React.FC<StatRollingProps> = ({ onComplete }) => {
  const [stats, setStats] = useState<Stat[]>(abilityStats);
  const [rolling, setRolling] = useState(false);
  const [activeStatIndex, setActiveStatIndex] = useState<number | null>(null);
  const [availablePoints, setAvailablePoints] = useState<number[]>([]);

  // 4d6 drop lowest
  const rollStat = () => {
    const rolls = Array.from(
      { length: 4 },
      () => Math.floor(Math.random() * 6) + 1
    );
    const sorted = [...rolls].sort((a, b) => b - a);
    return {
      total: sorted.slice(0, 3).reduce((sum, num) => sum + num, 0),
      rolls: rolls,
    };
  };

  const rollAllStats = async () => {
    setRolling(true);
    const points: number[] = [];

    // Roll 6 times for each stat
    for (let i = 0; i < 6; i++) {
      const { total } = rollStat();
      points.push(total);
    }

    setAvailablePoints(points.sort((a, b) => b - a));
    setRolling(false);
  };

  const calculateModifier = (value: number): number => {
    return Math.floor((value - 10) / 2);
  };

  const assignStatValue = (statIndex: number, pointIndex: number) => {
    const newStats = [...stats];
    const newPoints = [...availablePoints];

    // If this stat already had a value, put it back in available points
    if (newStats[statIndex].value > 0) {
      newPoints.push(newStats[statIndex].value);
      newPoints.sort((a, b) => b - a);
    }

    const value = newPoints[pointIndex];
    newStats[statIndex] = {
      ...newStats[statIndex],
      value: value,
      modifier: calculateModifier(value),
      rolls: Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1),
    };

    newPoints.splice(pointIndex, 1);

    setStats(newStats);
    setAvailablePoints(newPoints);
    setActiveStatIndex(null);

    // 모든 스탯이 할당되었는지 확인하고 onComplete 호출
    const isComplete = newStats.every((stat) => stat.value > 0);
    if (isComplete && onComplete) {
      const formattedStats = newStats.reduce((acc, stat) => {
        acc[stat.name.toLowerCase()] = {
          value: stat.value,
          modifier: stat.modifier,
        };
        return acc;
      }, {} as Record<string, { value: number; modifier: number }>);

      onComplete(formattedStats);
    }
  };

  const resetStats = () => {
    setStats(
      stats.map((stat) => ({ ...stat, value: 0, modifier: 0, rolls: [] }))
    );
    setAvailablePoints([]);
    setActiveStatIndex(null);

    // Reset를 했을 때 onComplete 호출하여 상위 컴포넌트 상태도 초기화
    if (onComplete) {
      onComplete({});
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5" />
            Ability Scores
          </CardTitle>
          <CardDescription>
            Roll for your character's ability scores using 4d6, dropping the
            lowest roll
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={rollAllStats}
              disabled={rolling || availablePoints.length > 0}
            >
              {rolling ? "Rolling..." : "Roll Stats"}
            </Button>
            <Button
              variant="outline"
              onClick={resetStats}
              disabled={
                rolling ||
                (availablePoints.length === 0 &&
                  !stats.some((s) => s.value > 0))
              }
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {availablePoints.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Available Scores:</h4>
              <div className="flex flex-wrap gap-2">
                {availablePoints.map((point, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-lg py-2 px-3"
                  >
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 mt-4">
            {stats.map((stat, index) => (
              <Card key={stat.name} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stat.icon}
                      <div>
                        <div className="font-medium">{stat.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.description}
                        </div>
                      </div>
                    </div>
                    {stat.value > 0 ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-lg">
                          {stat.value}
                        </Badge>
                        <Badge
                          variant={
                            stat.modifier >= 0 ? "default" : "destructive"
                          }
                          className="text-sm"
                        >
                          {stat.modifier >= 0 ? "+" : ""}
                          {stat.modifier}
                        </Badge>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={availablePoints.length === 0}
                        onClick={() => setActiveStatIndex(index)}
                      >
                        Assign Score
                      </Button>
                    )}
                  </div>
                  {activeStatIndex === index && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-card border rounded-md shadow-lg p-2">
                      <div className="flex flex-col gap-1">
                        {availablePoints.map((point, pointIndex) => (
                          <Button
                            key={pointIndex}
                            variant="ghost"
                            size="sm"
                            onClick={() => assignStatValue(index, pointIndex)}
                          >
                            {point}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stat Details</CardTitle>
          <CardDescription>
            Your character's natural abilities and their impact on various
            skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="font-medium">{stat.name}</span>
                </div>
                {stat.value > 0 && (
                  <Badge variant="outline">{stat.rolls?.join(", ")}</Badge>
                )}
              </div>
              {stat.value > 0 && (
                <div className="text-sm text-muted-foreground">
                  Affects: {getStatAffects(stat.name)}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatRolling;
