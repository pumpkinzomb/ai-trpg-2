import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased"
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 mx-auto w-full max-w-7xl">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
