import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  description: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  description,
}: ConfirmDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그 삭제 확인</DialogTitle>
          <DialogDescription>
            다음 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            {description && (
              <p className="mt-2 p-2 bg-muted rounded-md">
                "
                {description.length > 100
                  ? `${description.substring(0, 100)}...`
                  : description}
                "
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
