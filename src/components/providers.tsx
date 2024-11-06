"use client";

import { SessionProvider } from "next-auth/react";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        {...props}
      >
        {children}
        <Toaster />
      </NextThemesProvider>
    </SessionProvider>
  );
}
