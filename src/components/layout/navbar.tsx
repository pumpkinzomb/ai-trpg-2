"use client";

import { UserNav } from "@/components/auth/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Gamepad2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const { toast } = useToast();

  const handleArenaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toast({
      description: "추후 기능 업데이트 됩니다.",
    });
  };

  return (
    <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-1">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <span className="inline-block font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              ZOMB's TRPG
            </span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/worlds">
              <Button
                variant="ghost"
                className="text-sm font-medium hover:text-primary"
              >
                판타지 세계
              </Button>
            </Link>
            <Link href="/characters">
              <Button
                variant="ghost"
                className="text-sm font-medium hover:text-primary"
              >
                캐릭터
              </Button>
            </Link>
            <Link href="/arena" onClick={handleArenaClick}>
              <Button
                variant="ghost"
                className="text-sm font-medium hover:text-primary"
              >
                아레나
              </Button>
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ModeToggle />
          <UserNav />
        </div>
      </div>
    </div>
  );
}
