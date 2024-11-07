import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Feature {
  name: string;
  type: "passive" | "active";
  effect: string;
}

interface Spell {
  _id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  effect: {
    type: string;
    dice?: string;
    bonus?: number;
  };
  description: string;
}

interface Props {
  features: Feature[];
  spells: {
    known: Spell[];
    slots: Array<{
      level: number;
      total: number;
      used: number;
    }>;
  };
  class: string;
}

export default function CharacterFeatures({
  features,
  spells,
  class: className,
}: Props) {
  const hasSpells = [
    "Wizard",
    "Cleric",
    "Druid",
    "Bard",
    "Sorcerer",
    "Warlock",
  ].includes(className);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Features & Abilities</CardTitle>
        <CardDescription>
          Class features, racial traits, and magical abilities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="features">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            {hasSpells && <TabsTrigger value="spells">Spells</TabsTrigger>}
          </TabsList>

          <TabsContent value="features">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="font-medium">{feature.name}</span>
                      </div>
                      <Badge>{feature.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.effect}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {hasSpells && (
            <TabsContent value="spells">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {spells.slots.map((slot) => (
                    <div key={slot.level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          Level {slot.level} Slots
                        </h4>
                        <Badge variant="outline">
                          {slot.total - slot.used}/{slot.total}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {spells.known
                          .filter((spell) => spell.level === slot.level)
                          .map((spell) => (
                            <div
                              key={spell._id}
                              className="p-2 border rounded-lg space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {spell.name}
                                </span>
                                <Badge>{spell.school}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {spell.description}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
