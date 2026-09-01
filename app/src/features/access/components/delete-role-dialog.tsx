import { toast } from "sonner";

import type { Role } from "@/features/access/api/list-roles.ts";

import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog.tsx";
import { useDeleteRole } from "@/features/access/api/delete-role.ts";

interface DeleteRoleDialogProps {
  onDeleted: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
  role: Role;
}

export function DeleteRoleDialog({ onDeleted, onOpenChange, open, organizationId, role }: DeleteRoleDialogProps) {
  const deleteRole = useDeleteRole({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (deleted) => {
        toast.success(`${deleted.role} was deleted.`);
        onOpenChange(false);
        onDeleted();
      },
    },
    organizationId,
  });

  return (
    <ConfirmActionDialog
      confirmLabel="Delete role"
      description="This removes the role and every permission granted to it. Members still holding it must be reassigned first. This cannot be undone."
      isPending={deleteRole.isPending}
      onConfirm={() => deleteRole.mutate({ data: { organizationId, role: role.name } })}
      onOpenChange={onOpenChange}
      open={open}
      pendingLabel="Deleting…"
      title={`Delete ${role.name}?`}
    />
  );
}
