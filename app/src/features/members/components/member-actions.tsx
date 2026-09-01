import { EllipsisVerticalIcon, ShieldIcon, UserMinusIcon } from "lucide-react";
import { useState } from "react";

import type { Member } from "@/features/members/api/list-members.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { MemberRolesSheet } from "@/features/members/components/member-roles-sheet.tsx";
import { RemoveMemberDialog } from "@/features/members/components/remove-member-dialog.tsx";

interface MemberActionsProps {
  member: Member;
  organizationId: string;
}

export function MemberActions({ member, organizationId }: MemberActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  if (member.isSuperAdmin) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisVerticalIcon />
            <span className="sr-only">{`Actions for ${member.name}`}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <ShieldIcon />
            Edit roles
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsRemoving(true)} variant="destructive">
            <UserMinusIcon />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditing && (
        <MemberRolesSheet
          member={member}
          onOpenChange={setIsEditing}
          open={isEditing}
          organizationId={organizationId}
        />
      )}

      {isRemoving && (
        <RemoveMemberDialog
          member={member}
          onOpenChange={setIsRemoving}
          open={isRemoving}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
