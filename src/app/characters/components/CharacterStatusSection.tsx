import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Map, Hammer, Coffee, Loader2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CharacterStatus {
  status: {
    dungeon: {
      isActive: boolean;
      dungeonId?: string;
    };
    labor: {
      isActive: boolean;
    };
  };
}

interface CharacterStatusSectionProps {
  characterId: string;
}

export function CharacterStatusSection({
  characterId,
}: CharacterStatusSectionProps) {
  const router = useRouter();
  const [status, setStatus] = useState<CharacterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/characters/status?characterId=${characterId}`
        );
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setStatus(data.status);
      } catch (err) {
        console.error("Error fetching character status:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [characterId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="flex items-center gap-2 px-3 py-1.5"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>상태 확인 중...</span>
        </Badge>
      </div>
    );
  }

  if (error || !status) {
    return (
      <Badge variant="outline" className="text-destructive">
        상태 확인 실패
      </Badge>
    );
  }

  const getStatusInfo = () => {
    if (status.status.dungeon.isActive) {
      return {
        icon: Map,
        text: "던전 탐험 중",
        color: "text-blue-500",
        borderColor: "border-blue-500/50",
        bgHover: "hover:bg-blue-500/10",
        gradientFrom: "from-blue-500/20",
        gradientTo: "to-blue-500/0",
        tooltipText: "던전으로 이동하기",
        link: status.status.dungeon.dungeonId ? `/worlds/dungeon` : null,
      };
    }
    if (status.status.labor.isActive) {
      return {
        icon: Hammer,
        text: "노역 중",
        color: "text-orange-500",
        borderColor: "border-orange-500/50",
        bgHover: "hover:bg-orange-500/10",
        gradientFrom: "from-orange-500/20",
        gradientTo: "to-orange-500/0",
        tooltipText: "노역장으로 이동하기",
        link: "/worlds/labor",
      };
    }
    return {
      icon: Coffee,
      text: "휴식 중",
      color: "text-green-500",
      borderColor: "border-green-500/50",
      bgHover: "hover:bg-green-500/10",
      gradientFrom: "from-green-500/20",
      gradientTo: "to-green-500/0",
      link: null,
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  const renderNavigationButton = () => {
    if (!statusInfo.link) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "ml-2 gap-2 group relative overflow-hidden transition-all duration-300",
                "border opacity-80 hover:opacity-100",
                statusInfo.borderColor,
                statusInfo.color,
                statusInfo.bgHover
              )}
              onClick={() => router.push(statusInfo.link!)}
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                  "bg-gradient-to-r",
                  statusInfo.gradientFrom,
                  statusInfo.gradientTo
                )}
              />
              <span className="relative">이동하기</span>
              <ExternalLink
                className={cn(
                  "w-3 h-3 relative transition-transform",
                  "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusInfo.tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="flex items-center">
      <Badge
        variant="outline"
        className={cn(
          "flex items-center gap-2 px-3 py-1.5",
          statusInfo.color,
          statusInfo.borderColor
        )}
      >
        <StatusIcon className="w-4 h-4" />
        <span>{statusInfo.text}</span>
      </Badge>
      {renderNavigationButton()}
    </div>
  );
}
