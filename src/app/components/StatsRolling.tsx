import React, { useState } from "react";
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

interface Stat {
  name: string;
  value: number;
  rolls?: number[];
  modifier: number;
  icon: React.ReactNode;
  description: string;
}

const StatRolling: React.FC<{
  onComplete?: (stats: Record<string, number>) => void;
}> = ({ onComplete }) => {
  const [stats, setStats] = useState<Stat[]>([
    {
      name: "Strength",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Sword className="w-5 h-5" />,
      description: "Natural athleticism, bodily power, and physical force",
    },
    {
      name: "Dexterity",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Hand className="w-5 h-5" />,
      description: "Agility, reflexes, balance, and hand-eye coordination",
    },
    {
      name: "Constitution",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Heart className="w-5 h-5" />,
      description: "Health, stamina, and vital force",
    },
    {
      name: "Intelligence",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Brain className="w-5 h-5" />,
      description: "Mental acuity, recall ability, and analytical skill",
    },
    {
      name: "Wisdom",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Eye className="w-5 h-5" />,
      description: "Awareness, intuition, and force of will",
    },
    {
      name: "Charisma",
      value: 0,
      modifier: 0,
      rolls: [],
      icon: <Smile className="w-5 h-5" />,
      description: "Force of personality, persuasiveness, and leadership",
    },
  ]);
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
  };

  const resetStats = () => {
    setStats(
      stats.map((stat) => ({ ...stat, value: 0, modifier: 0, rolls: [] }))
    );
    setAvailablePoints([]);
    setActiveStatIndex(null);
  };

  const isComplete = stats.every((stat) => stat.value > 0);

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
              disabled={rolling || availablePoints.length === 0}
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

// 각 능력치가 영향을 미치는 기술들을 반환하는 헬퍼 함수
function getStatAffects(statName: string): string {
  const affects: Record<string, string> = {
    Strength: "Athletics, melee attacks, carrying capacity",
    Dexterity: "Acrobatics, Stealth, ranged attacks, initiative",
    Constitution: "Hit points, concentration saves, endurance",
    Intelligence: "Arcana, History, Investigation, Nature, Religion",
    Wisdom: "Animal Handling, Insight, Medicine, Perception, Survival",
    Charisma: "Deception, Intimidation, Performance, Persuasion",
  };

  return affects[statName] || "";
}

export default StatRolling;
