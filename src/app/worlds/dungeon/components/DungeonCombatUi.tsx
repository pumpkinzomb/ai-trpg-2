import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

// Combat interface remains the same
const CombatLayout = ({
  children,
  combatImage,
}: {
  children: React.ReactNode;
  combatImage: { url: string | null; loading: boolean };
}) => {
  return (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
      {/* Combat Image Background */}
      {combatImage.loading ? (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <p className="text-muted-foreground">전투 장면 생성 중...</p>
        </div>
      ) : combatImage.url ? (
        <img
          src={combatImage.url}
          alt="Combat Scene"
          className="absolute inset-0 w-full h-full object-contain"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
      )}

      {/* Semi-transparent overlay for better UI readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* UI Layout Container */}
      <div className="relative h-full flex flex-col">{children}</div>
    </div>
  );
};

// Enemy Card component with transparent background
const EnemyCard = ({
  children,
  selected,
  onClick,
  dead,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  dead?: boolean;
}) => {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "transition-all duration-300",
        "bg-black/50 backdrop-blur-sm",
        "border-white/20 hover:border-white/40",
        selected && "ring-2 ring-primary border-primary",
        dead && "opacity-50",
        "cursor-pointer"
      )}
    >
      {children}
    </Card>
  );
};

// Action Button with glass effect
const ActionButton = ({
  children,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 rounded-lg",
        "bg-white/10 backdrop-blur-sm",
        "border border-white/20",
        "transition-all duration-300",
        "hover:bg-white/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active && "bg-primary/50 border-primary"
      )}
    >
      {children}
    </button>
  );
};

export { CombatLayout, EnemyCard, ActionButton };
