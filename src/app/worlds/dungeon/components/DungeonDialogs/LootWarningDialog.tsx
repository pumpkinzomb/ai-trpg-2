import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface LootWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LootWarningDialog({
  open,
  onOpenChange,
  onConfirm,
}: LootWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>미획득 보상 경고</DialogTitle>
          <DialogDescription>
            현재 획득하지 않은 보상이 있습니다. 계속 진행하면 이 보상들을 잃게
            됩니다. 계속 진행하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            계속 진행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
