import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EscapeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  inventoryCount: number;
}

export function EscapeConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  inventoryCount,
}: EscapeConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>던전을 탈출하시겠습니까?</DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>던전을 탈출하면 다음과 같은 불이익이 있습니다:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>현재 소지금의 20%를 잃습니다</li>
                <li>획득한 아이템의 50%를 잃을 수 있습니다</li>
              </ul>
              {inventoryCount > 0 && (
                <p className="mt-4 text-yellow-500">
                  현재 {inventoryCount}개의 아이템을 보유 중입니다
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            탈출하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
