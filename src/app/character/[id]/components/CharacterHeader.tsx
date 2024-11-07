"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";

export default function CharacterHeader({ character }: { character: any }) {
  const experienceToNextLevel = (level: number) => level * 1000;
  const progress =
    (character.experience / experienceToNextLevel(character.level)) * 100;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden">
            <Image
              src={character.profileImage}
              alt={character.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{character.name}</h1>
                <p className="text-muted-foreground">
                  Level {character.level} {character.race} {character.class}
                </p>
              </div>

              <div className="text-right">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <div className="w-64">
                    <Progress value={progress} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {character.experience} /{" "}
                    {experienceToNextLevel(character.level)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">HP</p>
                <p className="text-xl font-bold">
                  {character.hp.current} / {character.hp.max}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hit Dice</p>
                <p className="text-xl font-bold">{character.hp.hitDice}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
