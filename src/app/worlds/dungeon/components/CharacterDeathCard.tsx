import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skull } from "lucide-react";

interface CharacterDeathCardProps {
  onConfirm: () => void;
  deathCause?: "trap" | "combat";
}

export function CharacterDeathCard({
  onConfirm,
  deathCause,
}: CharacterDeathCardProps) {
  return (
    <Card className="bg-red-500/10 border-red-500/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-red-600">
          <Skull className="h-6 w-6" />
          <h3 className="text-lg font-semibold">캐릭터 사망</h3>
        </div>

        <p className="text-muted-foreground">
          {deathCause === "trap"
            ? "함정으로 인해 치명상을 입었습니다."
            : "전투에서 치명상을 입었습니다."}
        </p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• 캐릭터가 전투 불능 상태가 되었습니다</p>
          <p>• 신전에서 치료를 받아야 합니다</p>
          <p>• 일부 아이템과 골드를 잃을 수 있습니다</p>
        </div>

        <Button
          variant="destructive"
          className="w-full mt-4"
          onClick={onConfirm}
        >
          <Skull className="w-4 h-4 mr-2" />
          신전으로 이동
        </Button>
      </CardContent>
    </Card>
  );
}
