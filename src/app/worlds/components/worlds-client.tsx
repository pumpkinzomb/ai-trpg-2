"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Sword,
  Castle,
  Church,
  Swords,
  Store,
  Lock,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function WorldsClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const handleLockedContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    toast({
      description: "추후 기능 업데이트 됩니다.",
    });
  };

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    location: any
  ) => {
    if (location.locked) {
      handleLockedContent(e);
      return;
    }

    e.preventDefault();
    setIsNavigating(location.title);
    router.push(location.href);
  };

  const worldLocations = [
    {
      title: "모험",
      description: "광활한 대륙을 탐험하고 전설적인 보물을 찾아나서세요",
      icon: <Sword className="h-8 w-8" />,
      href: "/worlds/adventure",
      color: "from-amber-500 to-orange-600",
      locked: true,
    },
    {
      title: "던전",
      description: "어둠 속에 숨겨진 위험한 던전에서 강력한 몬스터에 맞서세요",
      icon: <Castle className="h-8 w-8" />,
      href: "/worlds/dungeon",
      color: "from-purple-500 to-indigo-600",
      locked: true,
    },
    {
      title: "신전",
      description: "신성한 힘으로 치유받고 새로운 힘을 얻으세요",
      icon: <Church className="h-8 w-8" />,
      href: "/worlds/temple",
      color: "from-blue-500 to-cyan-600",
      locked: false,
    },
    {
      title: "아레나",
      description: "다른 모험가들과의 전투에서 당신의 실력을 증명하세요",
      icon: <Swords className="h-8 w-8" />,
      href: "/arena",
      color: "from-red-500 to-pink-600",
      locked: true,
    },
    {
      title: "마을",
      description: "다양한 상점에서 장비를 구매하고 거래하세요",
      icon: <Store className="h-8 w-8" />,
      href: "/worlds/town",
      color: "from-green-500 to-emerald-600",
      locked: false,
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            판타지 세계에 오신 것을 환영합니다
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            광활한 대륙을 탐험하고, 어둠 속의 던전을 정복하며, 강력한 적과 맞서
            싸우세요. 당신만의 영웅 이야기가 시작됩니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {worldLocations.map((location, index) => (
            <Link
              key={location.title}
              href={location.href}
              onClick={(e) => handleNavigation(e, location)}
              className="group"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow relative overflow-hidden group-hover:border-primary/50">
                  {location.locked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="space-y-4">
                    <div
                      className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${location.color} shadow-lg`}
                    >
                      {isNavigating === location.title ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      ) : (
                        <div className="text-white">{location.icon}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">{location.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {location.description}
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
