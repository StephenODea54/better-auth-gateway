import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import type { Resource } from "@/features/access/api/list-resources.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { DeleteResourceDialog } from "@/features/access/components/delete-resource-dialog.tsx";
import { ResourceSheet } from "@/features/access/components/resource-sheet.tsx";

interface ResourceActionsProps {
  organizationId: string;
  resource: Resource;
}

export function ResourceActions({ organizationId, resource }: ResourceActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisVerticalIcon />
            <span className="sr-only">{`Actions for ${resource.key}`}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditing(true)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setIsDeleting(true)} variant="destructive">
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isEditing && (
        <ResourceSheet
          onOpenChange={setIsEditing}
          open={isEditing}
          organizationId={organizationId}
          resource={resource}
        />
      )}

      {isDeleting && (
        <DeleteResourceDialog
          onOpenChange={setIsDeleting}
          open={isDeleting}
          organizationId={organizationId}
          resource={resource}
        />
      )}
    </>
  );
}
