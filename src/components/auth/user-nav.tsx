"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Shield, User, Settings, LogOut, Gamepad } from "lucide-react";

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) {
    return (
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => router.push("/auth/signin")}>
          로그인
        </Button>
        <Button onClick={() => router.push("/auth/signup")}>회원가입</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={session.user.image ?? ""}
              alt={session.user.name ?? ""}
            />
            <AvatarFallback className="bg-primary/10">
              {session.user.name?.[0] || session.user.email?.[0]}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <Gamepad className="mr-2 h-4 w-4" />
            <span>대시보드</span>
            <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>프로필</span>
            <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>설정</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          {session.user.role === "admin" && (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>관리자</span>
              <DropdownMenuShortcut>⌘A</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
