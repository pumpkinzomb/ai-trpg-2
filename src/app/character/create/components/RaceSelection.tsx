import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

interface Race {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  traits: Array<{ name: string; value: string }>;
  size: string;
  speed: number;
  languages: string[];
}

interface RaceSelectionProps {
  races: Race[];
  onSelect?: (race: Race) => void;
  selectedRaceId?: string;
}

const RaceSelection: React.FC<RaceSelectionProps> = ({
  races,
  onSelect,
  selectedRaceId,
}) => {
  const [selectedRace, setSelectedRace] = useState<Race | null>(
    races.find((race) => race.id === selectedRaceId) || null
  );

  const handleRaceSelect = (race: Race) => {
    setSelectedRace(race);
    if (onSelect) {
      onSelect(race);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Choose Your Race</h3>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {races.map((race) => (
              <Card
                key={race.id}
                className={`cursor-pointer transition-colors hover:bg-accent
                  ${selectedRace?.id === race.id ? "border-primary" : ""}`}
                onClick={() => handleRaceSelect(race)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {race.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{race.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {race.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        {selectedRace ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {selectedRace.icon}
                </div>
                <div>
                  <CardTitle>{selectedRace.name}</CardTitle>
                  <CardDescription>{selectedRace.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Racial Traits</h4>
                <div className="space-y-2">
                  {selectedRace.traits.map((trait, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{trait.name}</Badge>
                      <span className="text-sm">{trait.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Size</h4>
                  <Badge>{selectedRace.size}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Speed</h4>
                  <Badge>{selectedRace.speed} ft.</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Languages</h4>
                <div className="flex gap-2">
                  {selectedRace.languages.map((language) => (
                    <Badge key={language} variant="secondary">
                      {language}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center text-muted-foreground p-6">
              <Eye className="w-12 h-12 mx-auto mb-4" />
              <p>Select a race to view its details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RaceSelection;
