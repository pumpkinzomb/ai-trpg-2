import { Card } from "@/components/ui/card";

const CharacterSkeleton = () => (
  <Card className="p-4">
    <div className="flex items-start gap-6">
      <div className="flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
        <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted animate-pulse rounded" />
          <div className="h-2 w-full bg-muted animate-pulse rounded" />
        </div>
      </div>
    </div>
  </Card>
);

export default CharacterSkeleton;
