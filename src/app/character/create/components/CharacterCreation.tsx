"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Sword,
  Shield,
  Crown,
  ChevronRight,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import RaceSelection from "./RaceSelection";
import ClassSelection from "./ClassSelection";
import StatsRolling from "./StatsRolling";
import { CharacterClass } from "./ClassSelection";
import {
  commonRaces,
  exoticRaces,
  calculateInitialHP,
  getStartingGold,
  getInitialSpellSlots,
  getHitDice,
  getInitialResource,
} from "@/app/utils/character";
import axios from "axios";

interface CharacterCreationState {
  name: string;
  race: {
    id: string;
    name: string;
    traits: { name: string; value: string }[];
  } | null;
  class: {
    id: string;
    name: string;
    features: { name: string; value: string }[];
    proficiencies: {
      armor: string[];
      weapons: string[];
      tools: string[];
      skills: number;
      skillChoices: string[];
    };
    hitDice: string;
  } | null;
  stats: Record<string, { value: number; modifier: number }> | null;
  selectedSkills: string[];
}

const CharacterCreation = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [characterData, setCharacterData] = useState<CharacterCreationState>({
    name: "",
    race: null,
    class: null,
    stats: null,
    selectedSkills: [],
  });
  const { toast } = useToast();
  const totalSteps = 3;
  const router = useRouter();

  const steps = [
    { id: 1, name: "Race", icon: <Crown className="w-5 h-5" /> },
    { id: 2, name: "Class", icon: <Sword className="w-5 h-5" /> },
    { id: 3, name: "Stats", icon: <Shield className="w-5 h-5" /> },
  ];

  const handleRaceSelect = (selectedRace: CharacterCreationState["race"]) => {
    setCharacterData((prev) => ({
      ...prev,
      race: selectedRace,
    }));
  };

  const handleClassSelect = (selectedClass: CharacterClass) => {
    setCharacterData((prev) => ({
      ...prev,
      class: selectedClass,
    }));
  };

  const handleProficienciesChange = (proficiencies: string[]) => {
    setCharacterData((prev) => ({
      ...prev,
      selectedSkills: proficiencies,
    }));
  };

  const handleStatsComplete = (
    stats: Record<string, { value: number; modifier: number }>
  ) => {
    setCharacterData((prev) => ({
      ...prev,
      stats,
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCharacterData((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  };

  const validateStep = () => {
    console.log("check characterData", characterData);
    switch (step) {
      case 1:
        if (!characterData.race) {
          toast({
            title: "Race Required",
            description: "Please select a race for your character",
            variant: "destructive",
          });
          return false;
        }
        break;
      case 2:
        if (!characterData.class) {
          toast({
            title: "Class Required",
            description: "Please select a class for your character",
            variant: "destructive",
          });
          return false;
        }
        if (
          characterData.selectedSkills.length <
          (characterData.class?.proficiencies.skills || 0)
        ) {
          toast({
            title: "Skills Required",
            description: `Please select ${characterData.class.proficiencies.skills} skills`,
            variant: "destructive",
          });
          return false;
        }
        break;
      case 3:
        if (!characterData.stats) {
          toast({
            title: "Stats Required",
            description: "Please complete your character's stats",
            variant: "destructive",
          });
          return false;
        }
        if (!characterData.name.trim()) {
          toast({
            title: "Name Required",
            description: "Please enter a name for your character",
            variant: "destructive",
          });
          return false;
        }
        break;
    }
    return true;
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    setLoading(true);
    try {
      const characterClass = characterData.class!.name.toLowerCase();
      const constitutionScore = characterData.stats!.constitution.value;
      // 초기 HP 계산
      const maxHP = calculateInitialHP(characterClass, constitutionScore);

      // 초기 골드 계산
      const startingGold = getStartingGold(characterClass);

      // 초기 주문 슬롯 계산
      const initialSpellSlots = getInitialSpellSlots(characterClass);

      // 초기 리소스 계산
      const initialResource = getInitialResource(characterClass);

      // Transform the data to match the Character model
      const characterPayload = {
        name: characterData.name,
        level: 1,
        experience: 0,
        race: characterData.race!.name,
        class: characterData.class!.name,
        stats: {
          strength: characterData.stats!.strength.value,
          dexterity: characterData.stats!.dexterity.value,
          constitution: characterData.stats!.constitution.value,
          intelligence: characterData.stats!.intelligence.value,
          wisdom: characterData.stats!.wisdom.value,
          charisma: characterData.stats!.charisma.value,
        },
        proficiencies: characterData.selectedSkills,
        hp: {
          current: maxHP,
          max: maxHP,
          hitDice: getHitDice(characterClass),
        },
        spells: {
          known: [], // 클래스별 기본 주문은 별도로 추가 필요
          slots: initialSpellSlots,
        },
        features: [
          ...characterData.race!.traits.map((trait) => ({
            name: trait.name,
            type: "passive" as const,
            effect: trait.value,
          })),
          ...characterData.class!.features.map((feature) => ({
            name: feature.name,
            type: "passive" as const,
            effect: feature.value,
          })),
        ],
        equipment: {
          weapon: null,
          armor: null,
          shield: null,
          accessories: [],
        },
        inventory: [], // 초기 장비는 별도로 추가 필요
        gold: startingGold,
        arenaStats: {
          rank: 0,
          rating: 1000,
          wins: 0,
          losses: 0,
        },
        resource: initialResource,
      };

      console.log("check payload", characterPayload);

      const response = await axios.post("/api/characters", characterPayload);

      if (!response.data) {
        throw new Error("Failed to create character");
      }

      toast({
        title: "Character Created!",
        description: "Your character has been successfully created.",
      });

      const characterId = response.data._id.toString();
      // Redirect to character page or dashboard
      router.push(`/character/${characterId}`);
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create character",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === totalSteps) {
        handleComplete();
      } else {
        setStep(step + 1);
      }
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
                <TabsContent value="common">
                  <RaceSelection
                    races={commonRaces}
                    onSelect={handleRaceSelect}
                  />
                </TabsContent>
                <TabsContent value="exotic">
                  <RaceSelection
                    races={exoticRaces}
                    onSelect={handleRaceSelect}
                  />
                </TabsContent>
              </Tabs>
            )}

            {step === 2 && (
              <ClassSelection
                onSelect={handleClassSelect}
                onProficienciesChange={handleProficienciesChange}
                selectedClassId={characterData.class?.id}
              />
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="max-w-md">
                  <label className="text-sm font-medium">Character Name</label>
                  <Input
                    value={characterData.name}
                    onChange={handleNameChange}
                    placeholder="Enter character name"
                    className="mt-1"
                  />
                </div>
                <StatsRolling onComplete={handleStatsComplete} />
              </div>
            )}
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
            <Button onClick={handleNext} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  {step === totalSteps ? "Create Character" : "Next"}
                  {step !== totalSteps && (
                    <ChevronRight className="w-4 h-4 ml-2" />
                  )}
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
