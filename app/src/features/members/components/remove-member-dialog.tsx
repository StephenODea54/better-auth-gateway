import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { Member } from "@/features/members/api/list-members.ts";

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
import { useRemoveMember } from "@/features/members/api/remove-member.ts";

interface RemoveMemberDialogProps {
  member: Member;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
}

export function RemoveMemberDialog({ member, onOpenChange, open, organizationId }: RemoveMemberDialogProps) {
  const removeMember = useRemoveMember({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (removed) => {
        toast.success(`${removed.name} was removed.`);
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
            Remove
            {" "}
            {member.name}
            ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This drops their membership and every role it carried. Signing in through this
            application's identity provider will add them back as a plain member.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={removeMember.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={removeMember.isPending}
            onClick={(event) => {
              event.preventDefault();
              removeMember.mutate({
                data: { memberId: member.id, name: member.name, organizationId },
              });
            }}
            variant="destructive"
          >
            {removeMember.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Removing…
                  </>
                )
              : "Remove member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
