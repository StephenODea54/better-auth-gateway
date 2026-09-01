import { Loader2Icon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { Member } from "@/features/members/api/list-members.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useRoles } from "@/features/access/api/list-roles.ts";
import { useUpdateMemberRoles } from "@/features/members/api/update-member-roles.ts";

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
            <Empty className="rounded-xl border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <TriangleAlertIcon />
                </EmptyMedia>
                <EmptyTitle>Could not load roles</EmptyTitle>
                <EmptyDescription>{rolesQuery.error.message}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => void rolesQuery.refetch()} variant="outline">
                  <RefreshCwIcon />
                  Try again
                </Button>
              </EmptyContent>
            </Empty>
          )}

          {rolesQuery.isSuccess && (
            <Field>
              <FieldLabel>Roles</FieldLabel>
              <div className="overflow-hidden rounded-xl border">
                {assignable.map(role => (
                  <div
                    className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
                    key={role}
                  >
                    <span className="truncate text-sm font-medium">{role}</span>
                    <Switch
                      aria-label={role}
                      checked={held.has(role)}
                      onCheckedChange={() => toggle(role)}
                    />
                  </div>
                ))}
              </div>
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
          <Button
            disabled={changes === 0 || selected.length === 0 || updateMemberRoles.isPending}
            onClick={() => updateMemberRoles.mutate({
              data: { memberId: member.id, name: member.name, organizationId, roles: selected },
            })}
          >
            {updateMemberRoles.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving…
                  </>
                )
              : "Save roles"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
