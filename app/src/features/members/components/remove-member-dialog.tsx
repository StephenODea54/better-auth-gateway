import { toast } from "sonner";

import type { Member } from "@/features/members/api/list-members.ts";

import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog.tsx";
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
    <ConfirmActionDialog
      confirmLabel="Remove member"
      description="This drops their membership and every role it carried. Signing in through this application's identity provider will add them back as a plain member."
      isPending={removeMember.isPending}
      onConfirm={() => removeMember.mutate({
        data: { memberId: member.id, name: member.name, organizationId },
      })}
      onOpenChange={onOpenChange}
      open={open}
      pendingLabel="Removing…"
      title={`Remove ${member.name}?`}
    />
  );
}
