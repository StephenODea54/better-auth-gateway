import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import type { Application } from "@/features/applications/api/list-applications.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { ApplicationSheet } from "@/features/applications/components/application-sheet.tsx";
import { DeleteApplicationDialog } from "@/features/applications/components/delete-application-dialog.tsx";

interface ApplicationActionsProps {
  application: Application;
}

export function ApplicationActions({ application }: ApplicationActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <EllipsisVerticalIcon />
            <span className="sr-only">{`Actions for ${application.name}`}</span>
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
        <ApplicationSheet
          application={application}
          onOpenChange={setIsEditing}
          open={isEditing}
        />
      )}

      {isDeleting && (
        <DeleteApplicationDialog
          application={application}
          onOpenChange={setIsDeleting}
          open={isDeleting}
        />
      )}
    </>
  );
}
