import { Character } from "@/app/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface DungeonLoadingProps {
  type: "init" | "dungeon";
  selectedCharacter?: Character;
}

export function DungeonLoading({
  type,
  selectedCharacter,
}: DungeonLoadingProps) {
  if (type === "init") {
    return (
      <div className="container mx-auto py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2 text-muted-foreground">캐릭터 목록 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-20">
      <Card>
        <CardHeader>
          <CardTitle>던전 생성 중</CardTitle>
          <CardDescription>
            던전을 생성하고 있습니다. 잠시만 기다려주세요...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          {selectedCharacter && (
            <Card className="bg-muted w-full max-w-md">
              <CardContent className="flex items-center p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <img
                    src={selectedCharacter.profileImage}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedCharacter.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lv.{selectedCharacter.level} {selectedCharacter.race}{" "}
                    {selectedCharacter.class}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
