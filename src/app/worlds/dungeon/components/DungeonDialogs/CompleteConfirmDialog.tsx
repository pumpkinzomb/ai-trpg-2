import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  inventoryCount: number;
}

export function CompleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  inventoryCount,
}: CompleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>던전을 완료하시겠습니까?</DialogTitle>
          <DialogDescription>
            축하합니다! 던전의 마지막 스테이지를 클리어하셨습니다.
            {inventoryCount > 0 && (
              <p className="mt-2">
                획득한 아이템 {inventoryCount}개를 인벤토리로 옮깁니다.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm}>던전 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
