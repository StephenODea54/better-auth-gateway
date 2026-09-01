import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { LoadingButton } from "@/components/ui/loading-button.tsx";

interface ConfirmActionDialogProps {
  confirmLabel: string;
  description: string;
  isPending: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pendingLabel: string;
  title: string;
}

export function ConfirmActionDialog({
  confirmLabel,
  description,
  isPending,
  onConfirm,
  onOpenChange,
  open,
  pendingLabel,
  title,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <LoadingButton
            isPending={isPending}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            pendingLabel={pendingLabel}
            variant="destructive"
          >
            {confirmLabel}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
