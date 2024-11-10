"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LogType = "normal" | "critical" | "miss" | "system";

interface CombatLogEntry {
  text: string;
  type: LogType;
}

// 컴포넌트 props 타입 정의
interface CombatLogProps {
  combatLog: CombatLogEntry[];
}

const CombatLog: React.FC<CombatLogProps> = ({ combatLog }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatLog]); // combatLog가 변경될 때마다 실행

  return (
    <Card className="bg-muted/50">
      <CardContent
        ref={scrollRef}
        className="p-4 h-48 overflow-y-auto scroll-smooth"
      >
        <div className="space-y-1">
          {combatLog.map((log, index) => (
            <p
              key={index}
              className={cn(
                "text-sm px-2 py-1 rounded",
                log.type === "critical" && "text-red-500 bg-red-500/10",
                log.type === "miss" && "text-muted-foreground",
                log.type === "system" &&
                  "text-blue-500 bg-blue-500/10 font-medium"
              )}
            >
              {log.text}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CombatLog;
