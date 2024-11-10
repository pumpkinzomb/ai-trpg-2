import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DungeonActionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function DungeonActionInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: DungeonActionInputProps) {
  return (
    <Card className="mb-6">
      <CardContent className="space-y-4 p-4">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-4 rounded-lg border min-h-[100px] bg-background"
          placeholder="행동을 입력하세요..."
          disabled={isLoading}
        />
        <Button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              진행 중...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ArrowRight className="h-4 w-4" />
              행동하기
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
