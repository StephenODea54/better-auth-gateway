import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { Resource } from "@/features/access/api/list-resources.ts";

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
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete
            {" "}
            {resource.key}
            ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes the resource and revokes every one of its actions from all roles in this
            application. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteResource.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteResource.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteResource.mutate({ data: { key: resource.key, organizationId } });
            }}
            variant="destructive"
          >
            {deleteResource.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Deleting…
                  </>
                )
              : "Delete resource"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
