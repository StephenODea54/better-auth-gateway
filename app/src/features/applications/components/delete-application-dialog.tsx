import { toast } from "sonner";

import type { Application } from "@/features/applications/api/list-applications.ts";

import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog.tsx";
import { useDeleteApplication } from "@/features/applications/api/delete-application.ts";

interface DeleteApplicationDialogProps {
  application: Application;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function DeleteApplicationDialog({ application, onOpenChange, open }: DeleteApplicationDialogProps) {
  const deleteApplication = useDeleteApplication({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (deleted) => {
        toast.success(`${deleted.name} was deleted.`);
        onOpenChange(false);
      },
    },
  });

  return (
    <ConfirmActionDialog
      confirmLabel="Delete application"
      description="This removes the application, its members and its identity provider connection. Anyone signing in through it will be turned away. This cannot be undone."
      isPending={deleteApplication.isPending}
      onConfirm={() => deleteApplication.mutate({
        data: { id: application.id, name: application.name },
      })}
      onOpenChange={onOpenChange}
      open={open}
      pendingLabel="Deleting…"
      title={`Delete ${application.name}?`}
    />
  );
}
