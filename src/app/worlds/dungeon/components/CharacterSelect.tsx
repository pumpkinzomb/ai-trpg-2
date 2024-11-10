import { Character } from "@/app/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface CharacterSelectProps {
  selectedCharacter: Character | null;
  showDialog: boolean;
  onShowDialog: (show: boolean) => void;
  characters: Character[];
  onSelect: (character: Character) => void;
  onCreateNew: () => void;
}

export function CharacterSelect({
  selectedCharacter,
  showDialog,
  onShowDialog,
  characters,
  onSelect,
  onCreateNew,
}: CharacterSelectProps) {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>던전 탐험</CardTitle>
          <CardDescription>
            위험한 던전에서 보물과 영광을 손에 넣으세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedCharacter ? (
            <div className="space-y-4">
              <Card className="bg-muted">
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
              <Button
                variant="outline"
                onClick={() => onShowDialog(true)}
                className="w-full"
              >
                다른 캐릭터 선택
              </Button>
            </div>
          ) : (
            <Button onClick={() => onShowDialog(true)} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              캐릭터 선택하기
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={onShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>던전 탐험에 참여할 캐릭터를 선택하세요</DialogTitle>
            <DialogDescription>
              선택한 캐릭터로 던전을 탐험하게 됩니다. 신중하게 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {characters.map((character) => (
              <Card
                key={character._id.toString()}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onSelect(character)}
              >
                <CardContent className="flex items-center p-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={character.profileImage}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{character.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Lv.{character.level} {character.race} {character.class}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={onCreateNew} className="w-full">
              <Plus className="mr-2 h-4 w-4" />새 캐릭터 만들기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
