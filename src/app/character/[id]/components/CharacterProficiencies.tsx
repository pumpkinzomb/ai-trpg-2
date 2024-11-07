import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle } from "lucide-react";

interface Props {
  proficiencies: string[];
}

export default function CharacterProficiencies({ proficiencies }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Proficiencies
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="grid grid-cols-2 gap-2">
            {proficiencies.map((proficiency, index) => (
              <Badge key={index} variant="outline" className="justify-start">
                <CheckCircle className="w-3 h-3 mr-2" />
                {proficiency}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
