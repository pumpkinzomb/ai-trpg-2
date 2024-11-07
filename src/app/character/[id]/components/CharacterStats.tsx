import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Item } from "@/app/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dumbbell,
  Info,
  ChevronDown,
  Crown,
  Swords,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RaceType } from "@/app/types";

interface StatSource {
  value: number;
  source: string;
  type: "race" | "feature" | "equipment";
}

interface RaceAbilityBonus {
  [key: string]: number;
}

type RaceAbilityBonuses = Record<RaceType, RaceAbilityBonus>;

// 보너스 정의
const raceAbilityBonuses: RaceAbilityBonuses = {
  human: {
    strength: 1,
    dexterity: 1,
    constitution: 1,
    intelligence: 1,
    wisdom: 1,
    charisma: 1,
  },
  dwarf: {
    constitution: 2,
  },
  elf: {
    dexterity: 2,
  },
  halfling: {
    dexterity: 2,
  },
  dragonborn: {
    strength: 2,
    charisma: 1,
  },
  tiefling: {
    charisma: 2,
    intelligence: 1,
  },
};

interface CharacterStatsProps {
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  race: string;
  features: Array<{
    name: string;
    effect: string;
  }>;
  equipment: {
    weapon: Item | null;
    armor: Item | null;
    shield: Item | null;
    accessories: Item[];
  };
}

const statIcons = {
  strength: Dumbbell,
  dexterity: Crown,
  constitution: Shield,
  intelligence: Info,
  wisdom: Crown,
  charisma: Crown,
};

const statDescriptions = {
  strength:
    "근력은 캐릭터의 물리적 힘을 나타냅니다. 근접 공격, 물건 들기, 문 부수기 등에 영향을 줍니다.",
  dexterity:
    "민첩성은 캐릭터의 반사 신경과 손재주를 나타냅니다. AC, 원거리 공격, 재빠른 동작에 영향을 줍니다.",
  constitution:
    "건강은 캐릭터의 체력과 지구력을 나타냅니다. HP, 독 저항, 피로 저항에 영향을 줍니다.",
  intelligence:
    "지능은 캐릭터의 논리력과 기억력을 나타냅니다. 마법 주문, 수수께끼 풀기, 조사에 영향을 줍니다.",
  wisdom:
    "지혜는 캐릭터의 직관과 통찰력을 나타냅니다. 주변 인지, 치유 마법, 생존에 영향을 줍니다.",
  charisma:
    "매력은 캐릭터의 개성과 설득력을 나타냅니다. 대화, 협상, 지휘에 영향을 줍니다.",
};

const sourceTypeConfig = {
  race: {
    icon: Crown,
    color: "text-yellow-500 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900",
  },
  feature: {
    icon: Swords,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900",
  },
  equipment: {
    icon: Shield,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900",
  },
};

export default function CharacterStats({
  stats,
  race,
  features,
  equipment,
}: CharacterStatsProps) {
  const [openStats, setOpenStats] = useState<string[]>([]);

  const toggleStat = (stat: string) => {
    setOpenStats((prev) =>
      prev.includes(stat) ? prev.filter((s) => s !== stat) : [...prev, stat]
    );
  };

  const getModifierString = (value: number) => {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  const getStatSources = (statName: keyof typeof stats): StatSource[] => {
    const sources: StatSource[] = [];

    // 종족 보너스
    const raceBonus =
      raceAbilityBonuses[race.toLocaleLowerCase() as RaceType]?.[statName] || 0;
    if (raceBonus !== 0) {
      sources.push({
        value: raceBonus,
        source: `${race} Racial Bonus`,
        type: "race",
      });
    }

    // 특성 보너스
    features.forEach((feature) => {
      if (feature.effect?.toLowerCase().includes(statName.toLowerCase())) {
        const bonusMatch = feature.effect.match(/([+-]\d+)/);
        if (bonusMatch) {
          sources.push({
            value: parseInt(bonusMatch[0]),
            source: feature.name,
            type: "feature",
          });
        }
      }
    });

    // 장비 보너스
    const allItems = [
      equipment.weapon,
      equipment.armor,
      equipment.shield,
      ...equipment.accessories,
    ].filter(Boolean);

    allItems.forEach((item) => {
      item?.stats.effects.forEach((effect) => {
        if (effect.type.toLowerCase().includes(statName.toLowerCase())) {
          sources.push({
            value: parseInt(effect.value),
            source: item.name,
            type: "equipment",
          });
        }
      });
    });

    return sources;
  };

  const calculateFinalStat = (base: number, sources: StatSource[]) => {
    return sources.reduce((total, source) => total + source.value, base);
  };

  const StatDetail = ({
    name,
    base,
  }: {
    name: keyof typeof stats;
    base: number;
  }) => {
    const sources = getStatSources(name);
    const finalStat = calculateFinalStat(base, sources);
    const isOpen = openStats.includes(name);
    const Icon = statIcons[name];

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={() => toggleStat(name)}
        className={cn(
          "rounded-lg border p-3",
          isOpen ? "bg-accent" : "hover:bg-accent/50",
          "transition-all duration-200"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium capitalize">{name}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>{statDescriptions[name]}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {base}
              </Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge
                variant="outline"
                className={cn(
                  "font-mono",
                  finalStat > base
                    ? "text-green-500"
                    : finalStat < base
                    ? "text-red-500"
                    : ""
                )}
              >
                {finalStat}
              </Badge>
              <Badge
                className={cn(
                  finalStat > base
                    ? "bg-green-500"
                    : finalStat < base
                    ? "bg-red-500"
                    : ""
                )}
              >
                {getModifierString(finalStat)}
              </Badge>
            </div>

            <CollapsibleTrigger asChild>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen && "transform rotate-180"
                )}
              />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="mt-2">
          {sources.length > 0 ? (
            <ScrollArea className="h-[100px] pr-4">
              <div className="space-y-1 pl-7">
                {sources.map((source, index) => {
                  const SourceIcon = sourceTypeConfig[source.type].icon;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-2 p-1 rounded",
                        sourceTypeConfig[source.type].bgColor
                      )}
                    >
                      <SourceIcon
                        className={cn(
                          "w-4 h-4",
                          sourceTypeConfig[source.type].color
                        )}
                      />
                      <span className="text-sm">
                        {source.source}: {source.value >= 0 ? "+" : ""}
                        {source.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground pl-7">
              No modifiers affecting this ability score
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5" />
          Ability Scores
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {(Object.keys(stats) as Array<keyof typeof stats>).map((stat) => (
          <StatDetail key={stat} name={stat} base={stats[stat]} />
        ))}
      </CardContent>
    </Card>
  );
}
