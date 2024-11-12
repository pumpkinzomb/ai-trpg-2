import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface DeleteCharacterDialogProps {
  characterId: string;
  onDelete: () => void;
}

export function DeleteCharacterDialog({
  characterId,
  onDelete,
}: DeleteCharacterDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete();
        toast({
          title: "캐릭터 삭제 완료",
          description: "캐릭터가 성공적으로 삭제되었습니다.",
        });
      } else {
        throw new Error("Failed to delete character");
      }
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        variant: "destructive",
        title: "오류 발생",
        description: "캐릭터 삭제 중 문제가 발생했습니다. 다시 시도해주세요.",
      });
    } finally {
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 캐릭터와 관련된 모든 데이터가
            영구적으로 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
          >
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
