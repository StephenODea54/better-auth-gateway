import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { Role } from "@/features/access/api/list-roles.ts";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
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
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete
            {" "}
            {role.name}
            ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes the role and every permission granted to it. Members still holding it must
            be reassigned first. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteRole.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteRole.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteRole.mutate({ data: { organizationId, role: role.name } });
            }}
            variant="destructive"
          >
            {deleteRole.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Deleting…
                  </>
                )
              : "Delete role"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
