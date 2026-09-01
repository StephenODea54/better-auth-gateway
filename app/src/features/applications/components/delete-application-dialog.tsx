import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { Application } from "@/features/applications/api/list-applications.ts";

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
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete
            {" "}
            {application.name}
            ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This removes the application, its members and its identity provider connection. Anyone signing in
            through it will be turned away. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteApplication.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleteApplication.isPending}
            onClick={(event) => {
              event.preventDefault();
              deleteApplication.mutate({ data: { id: application.id, name: application.name } });
            }}
            variant="destructive"
          >
            {deleteApplication.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Deleting…
                  </>
                )
              : "Delete application"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
