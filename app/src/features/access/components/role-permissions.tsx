import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Role } from "@/features/access/api/list-roles.ts";
import type { VocabularyGroup } from "@/features/access/lib/permissions.ts";

import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useUpdateRole } from "@/features/access/api/update-role.ts";
import { DeleteRoleDialog } from "@/features/access/components/delete-role-dialog.tsx";
import { toPairs } from "@/features/access/lib/permissions.ts";

interface RolePermissionsProps {
  draft: Record<string, string[]> | undefined;
  onChange: (permission: Record<string, string[]>) => void;
  onDeleted: () => void;
  onDiscard: () => void;
  onSaved: () => void;
  organizationId: string;
  role: Role;
  vocabulary: VocabularyGroup[];
}

export function RolePermissions({
  draft,
  onChange,
  onDeleted,
  onDiscard,
  onSaved,
  organizationId,
  role,
  vocabulary,
}: RolePermissionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const updateRole = useUpdateRole({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (saved) => {
        toast.success(`${saved.role} was saved.`);
        onSaved();
      },
    },
    organizationId,
  });

  const permission = draft ?? role.permission;
  const granted = toPairs(permission);
  const saved = toPairs(role.permission);

  const changes = [...new Set([...granted, ...saved])]
    .filter(pair => granted.has(pair) !== saved.has(pair))
    .length;

  function toggle(key: string, action: string) {
    const next = { ...permission };
    const actions = new Set(next[key] ?? []);

    if (actions.has(action)) {
      actions.delete(action);
    }
    else {
      actions.add(action);
    }

    if (actions.size === 0) {
      delete next[key];
    }
    else {
      next[key] = [...actions].sort();
    }

    onChange(next);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      {!role.builtIn && (
        <div className="sticky top-0 z-10 flex items-center justify-end gap-2 border-b bg-background px-4 py-3">
          <span className="mr-auto text-sm text-muted-foreground">
            {changes === 0
              ? "No unsaved changes"
              : `${changes} unsaved ${changes === 1 ? "change" : "changes"}`}
          </span>
          <Button
            disabled={changes === 0 || updateRole.isPending}
            onClick={onDiscard}
            variant="outline"
          >
            Discard
          </Button>
          <Button
            disabled={changes === 0 || updateRole.isPending}
            onClick={() => updateRole.mutate({
              data: { organizationId, permission, role: role.name },
            })}
          >
            {updateRole.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving…
                  </>
                )
              : "Save changes"}
          </Button>
          <Button onClick={() => setIsDeleting(true)} size="icon" variant="ghost">
            <Trash2Icon />
            <span className="sr-only">{`Delete ${role.name}`}</span>
          </Button>
        </div>
      )}

      {vocabulary.map(group => (
        <section key={group.key}>
          <div className="border-b bg-muted/50 px-4 py-2 text-sm font-medium">{group.key}</div>

          {group.actions.map(action => (
            <div
              className="flex items-center justify-between gap-4 border-b px-4 py-2.5"
              key={`${group.key}:${action}`}
            >
              <span className="truncate text-sm">{`${group.key}:${action}`}</span>
              <Switch
                aria-label={`${group.key}:${action}`}
                checked={granted.has(`${group.key}:${action}`)}
                disabled={role.builtIn}
                onCheckedChange={() => toggle(group.key, action)}
              />
            </div>
          ))}
        </section>
      ))}

      {isDeleting && (
        <DeleteRoleDialog
          onDeleted={onDeleted}
          onOpenChange={setIsDeleting}
          open={isDeleting}
          organizationId={organizationId}
          role={role}
        />
      )}
    </div>
  );
}
