import { toast } from "sonner";

import type { Resource } from "@/features/access/api/list-resources.ts";

import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog.tsx";
import { useDeleteResource } from "@/features/access/api/delete-resource.ts";

interface DeleteResourceDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
  resource: Resource;
}

export function DeleteResourceDialog({ onOpenChange, open, organizationId, resource }: DeleteResourceDialogProps) {
  const deleteResource = useDeleteResource({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (deleted) => {
        toast.success(`${deleted.key} was deleted.`);
        onOpenChange(false);
      },
    },
    organizationId,
  });

  return (
    <ConfirmActionDialog
      confirmLabel="Delete resource"
      description="This removes the resource and revokes every one of its actions from all roles in this application. This cannot be undone."
      isPending={deleteResource.isPending}
      onConfirm={() => deleteResource.mutate({ data: { key: resource.key, organizationId } })}
      onOpenChange={onOpenChange}
      open={open}
      pendingLabel="Deleting…"
      title={`Delete ${resource.key}?`}
    />
  );
}
