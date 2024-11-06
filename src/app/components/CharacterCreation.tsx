"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Sword,
  Shield,
  User,
  Dices,
  Wand2,
  Crown,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { Character } from "../types";
import RaceSelection, { commonRaces, exoticRaces } from "./RaceSelection";

interface CharacterCreationState {
  race: string | null;
  class: string | null;
  stats: Character["stats"] | null;
  raceFeatures: Character["features"];
  classFeatures: Character["features"];
  proficiencies: string[];
  hitDice: string;
}

const CharacterCreation = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterCreationState>({
    race: null,
    class: null,
    stats: null,
    raceFeatures: [],
    classFeatures: [],
    proficiencies: [],
    hitDice: "",
  });
  const totalSteps = 3;

  const steps = [
    { id: 1, name: "Race", icon: <Crown className="w-5 h-5" /> },
    { id: 2, name: "Class", icon: <Sword className="w-5 h-5" /> },
    { id: 3, name: "Stats", icon: <Shield className="w-5 h-5" /> },
  ];

  const generateCharacterImage = async () => {
    setLoading(true);
    try {
      const prompt = `A fantasy character portrait of a ${characterData.race} ${
        characterData.class
      }, 
            with ${Object.entries(characterData.stats || {})
              .map(([stat, value]) => `${stat} ${value}`)
              .join(", ")}, 
            detailed, high quality, realistic`;

      const response = await fetch(
        "https://api-inference.huggingface.co/models/flux1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_HUGGINGFACE_TOKEN",
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      const result = await response.blob();
      return URL.createObjectURL(result);
    } catch (error) {
      console.error("Failed to generate image:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createCharacter = async (): Promise<Character> => {
    const image = await generateCharacterImage();

    // 캐릭터 초기값 설정
    const characterData = {
      userId: session?.user.id, // 세션에서 현재 유저 ID 가져오기
      name: characterName,
      class: characterData.class!,
      race: characterData.race!,
      stats: characterData.stats!,
      proficiencies: getProficiencies(
        characterData.class!,
        characterData.proficiencies
      ),
      features: [],
      spells: {
        known: [],
        slots: [],
      },
      equipment: {
        weapon: null,
        armor: null,
        shield: null,
        accessories: [],
      },
      inventory: [],
      gold: getStartingGold(characterData.class!),
    };

    try {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error("Failed to create character");
      }

      const newCharacter = await response.json();
      router.push(`/characters/${newCharacter._id}`);
    } catch (error) {
      console.error("Error creating character:", error);
      setError("Failed to create character. Please try again.");
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const character = await createCharacter();
      // 캐릭터 생성 완료 후 처리 (예: 캐릭터 페이지로 이동)
      console.log("Character created:", character);
    } catch (error) {
      console.error("Failed to create character:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Create Your Character</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Step {step} of {totalSteps}
              <Progress value={(step / totalSteps) * 100} className="w-32" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
              {steps.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors
                      ${
                        step >= s.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {s.icon}
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`w-12 h-0.5 transition-colors
                      ${step > s.id ? "bg-primary" : "bg-muted"}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {step === 1 && (
              <Tabs defaultValue="common" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="common">Common Races</TabsTrigger>
                  <TabsTrigger value="exotic">Exotic Races</TabsTrigger>
                </TabsList>
                <TabsContent value="common" className="space-y-4">
                  <RaceSelection races={commonRaces} />
                </TabsContent>
                <TabsContent value="exotic" className="space-y-4">
                  <RaceSelection races={exoticRaces} />
                </TabsContent>
              </Tabs>
            )}

            {/* Placeholder for other steps */}
            {step === 2 && <div>Class Selection</div>}
            {step === 3 && <div>Stats Rolling</div>}
            {step === 4 && <div>Appearance Customization</div>}
            {step === 5 && <div>Character Review</div>}
          </div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === totalSteps || loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CharacterCreation;
