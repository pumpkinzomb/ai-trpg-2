import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, Target, Crown } from "lucide-react";

interface ArenaStats {
  rank: number;
  rating: number;
  wins: number;
  losses: number;
}

export default function CharacterArenaStats({
  arenaStats,
}: {
  arenaStats: ArenaStats;
}) {
  const winRate =
    arenaStats.wins + arenaStats.losses > 0
      ? (
          (arenaStats.wins / (arenaStats.wins + arenaStats.losses)) *
          100
        ).toFixed(1)
      : "0.0";

  const getRankTier = (rating: number) => {
    if (rating >= 2000) return "Master";
    if (rating >= 1800) return "Diamond";
    if (rating >= 1600) return "Platinum";
    if (rating >= 1400) return "Gold";
    if (rating >= 1200) return "Silver";
    return "Bronze";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Arena Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Rank</span>
            </div>
            <Badge variant="outline" className="text-lg">
              #{arenaStats.rank}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Rating</span>
            </div>
            <div className="space-y-1">
              <Badge className="text-lg">
                {getRankTier(arenaStats.rating)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {arenaStats.rating} points
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Record</span>
            </div>
            <div className="space-y-1">
              <Badge variant="outline" className="text-lg">
                {arenaStats.wins}W {arenaStats.losses}L
              </Badge>
              <p className="text-sm text-muted-foreground">
                {winRate}% Win Rate
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
