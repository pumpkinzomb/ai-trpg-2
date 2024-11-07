import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CharacterStats({ stats }: { stats: any }) {
  const getModifierString = (value: number) => {
    const modifier = Math.floor((value - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : modifier.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ability Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([stat, value]: [string, any]) => (
            <div key={stat} className="flex items-center justify-between">
              <span className="capitalize">{stat}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{value}</Badge>
                <Badge>{getModifierString(value)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
