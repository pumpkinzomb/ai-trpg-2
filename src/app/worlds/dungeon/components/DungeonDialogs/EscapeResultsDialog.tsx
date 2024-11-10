import { EscapePenalties } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Package } from "lucide-react";

interface EscapeResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: EscapePenalties | null;
  onClose: () => void;
}

export function EscapeResultsDialog({
  open,
  onOpenChange,
  results,
  onClose,
}: EscapeResultsDialogProps) {
  if (!results) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>던전 탈출 결과</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 rounded-lg">
            <h4 className="font-semibold text-destructive mb-2">손실된 자원</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>{results.lostGold} Gold</span>
              </li>
              {results.lostItems.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-500" />
                  <span>{item.name || "알 수 없는 아이템"}</span>
                </li>
              ))}
            </ul>
          </div>

          {results.savedItems.length > 0 && (
            <div className="p-4 bg-success/10 rounded-lg">
              <h4 className="font-semibold text-success mb-2">보존된 아이템</h4>
              <ul className="space-y-2">
                {results.savedItems.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-500" />
                    <span>{item.name || "알 수 없는 아이템"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>마을로 돌아가기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
