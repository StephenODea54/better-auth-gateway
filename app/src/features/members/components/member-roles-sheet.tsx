import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Member } from "@/features/members/api/list-members.ts";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field.tsx";
import { LoadError } from "@/components/ui/load-error.tsx";
import { LoadingButton } from "@/components/ui/loading-button.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useRoles } from "@/features/access/api/list-roles.ts";
import { useUpdateMemberRoles } from "@/features/members/api/update-member-roles.ts";
import { RoleSwitchList } from "@/features/members/components/role-switch-list.tsx";

interface MemberRolesSheetProps {
  member: Member;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
}

export function MemberRolesSheet({ member, onOpenChange, open, organizationId }: MemberRolesSheetProps) {
  const rolesQuery = useRoles({ organizationId });
  const [selected, setSelected] = useState(member.roles);

  const updateMemberRoles = useUpdateMemberRoles({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (saved) => {
        toast.success(`${saved.name}'s roles were saved.`);
        onOpenChange(false);
      },
    },
    organizationId,
  });

  const assignable = useMemo(() => {
    const names = new Set([
      ...(rolesQuery.data ?? []).map(role => role.name),
      ...member.roles,
    ]);

    return [...names].sort();
  }, [member.roles, rolesQuery.data]);

  const held = new Set(selected);
  const saved = new Set(member.roles);
  const changes = assignable.filter(role => held.has(role) !== saved.has(role)).length;

  function toggle(role: string) {
    setSelected(current => current.includes(role)
      ? current.filter(name => name !== role)
      : [...current, role].sort());
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{`Roles for ${member.name}`}</SheetTitle>
          <SheetDescription>{member.email}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {rolesQuery.isPending && (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          )}

          {rolesQuery.isError && (
            <LoadError
              message={rolesQuery.error.message}
              onRetry={() => void rolesQuery.refetch()}
              title="Could not load roles"
            />
          )}

          {rolesQuery.isSuccess && (
            <Field>
              <FieldLabel>Roles</FieldLabel>
              <RoleSwitchList held={held} onToggle={toggle} roles={assignable} />
              <FieldDescription>
                A member holds every role switched on here, and every permission those roles grant.
                Only an owner can grant or revoke owner.
              </FieldDescription>
            </Field>
          )}
        </div>

        <SheetFooter>
          <span className="mr-auto self-center text-sm text-muted-foreground">
            {selected.length === 0
              ? "Pick at least one role"
              : `${changes === 0 ? "No" : changes} unsaved ${changes === 1 ? "change" : "changes"}`}
          </span>
          <LoadingButton
            disabled={changes === 0 || selected.length === 0}
            isPending={updateMemberRoles.isPending}
            onClick={() => updateMemberRoles.mutate({
              data: { memberId: member.id, name: member.name, organizationId, roles: selected },
            })}
            pendingLabel="Saving…"
          >
            Save roles
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
