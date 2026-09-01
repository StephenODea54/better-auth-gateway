import { LockIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { VocabularyGroup } from "@/features/access/lib/permissions.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useAccess } from "@/features/access/api/get-access.ts";
import { useResources } from "@/features/access/api/list-resources.ts";
import { useRoles } from "@/features/access/api/list-roles.ts";
import { CreateRoleSheet } from "@/features/access/components/create-role-sheet.tsx";
import { RolePermissions } from "@/features/access/components/role-permissions.tsx";
import { toPairs } from "@/features/access/lib/permissions.ts";
import { ac } from "@/features/auth/lib/access-control.ts";
import { cn } from "@/lib/utils.ts";

interface RolesPanelProps {
  organizationId: string;
}

export function RolesPanel({ organizationId }: RolesPanelProps) {
  const rolesQuery = useRoles({ organizationId });
  const resourcesQuery = useResources({ organizationId });
  const accessQuery = useAccess({ organizationId });
  const [selectedName, setSelectedName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string[]>>>({});

  const resources = resourcesQuery.data;

  function clearDraft(name: string) {
    setDrafts((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  const vocabulary = useMemo<VocabularyGroup[]>(() => {
    const groups = new Map<string, Set<string>>();

    for (const [key, actions] of Object.entries(ac.statements)) {
      groups.set(key, new Set(actions));
    }

    for (const resource of resources ?? []) {
      const actions = groups.get(resource.key) ?? new Set<string>();

      for (const action of resource.actions) {
        actions.add(action);
      }

      groups.set(resource.key, actions);
    }

    return [...groups].map(([key, actions]) => ({ actions: [...actions].sort(), key }));
  }, [resources]);

  if (rolesQuery.isPending || resourcesQuery.isPending || accessQuery.isPending) {
    return (
      <div className="flex min-h-0 flex-1 gap-4">
        <Skeleton className="h-full w-72 rounded-xl" />
        <Skeleton className="h-full flex-1 rounded-xl" />
      </div>
    );
  }

  if (rolesQuery.isError || resourcesQuery.isError || accessQuery.isError) {
    return (
      <Empty className="flex-1 rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Could not load roles</EmptyTitle>
          <EmptyDescription>
            {(rolesQuery.error ?? resourcesQuery.error ?? accessQuery.error)?.message}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() => {
              void rolesQuery.refetch();
              void resourcesQuery.refetch();
              void accessQuery.refetch();
            }}
            variant="outline"
          >
            <RefreshCwIcon />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  const roles = rolesQuery.data;
  const access = accessQuery.data;
  const selected = roles.find(role => role.name === selectedName) ?? roles[0];

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border">
      <div className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex-1 overflow-y-auto">
          {roles.map((role) => {
            const draft = drafts[role.name];
            const granted = toPairs(draft ?? role.permission);
            const saved = toPairs(role.permission);
            const isDirty = Boolean(draft)
              && (granted.size !== saved.size || [...granted].some(pair => !saved.has(pair)));

            return (
              <button
                className={cn(
                  "flex w-full items-center justify-between gap-2 border-l-2 px-4 py-3 text-left transition-colors",
                  role.name === selected.name
                    ? "border-l-primary bg-accent"
                    : "border-l-transparent hover:bg-accent/50",
                )}
                key={role.name}
                onClick={() => setSelectedName(role.name)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-sm font-medium">{role.name}</span>
                  {role.builtIn && <LockIcon className="size-3.5 shrink-0 text-muted-foreground" />}
                </span>
                {isDirty && <span className="text-xs text-muted-foreground">unsaved</span>}
              </button>
            );
          })}
        </div>

        {access.canCreate && (
          <div className="border-t p-2">
            <Button className="w-full justify-start" onClick={() => setIsCreating(true)} variant="ghost">
              <PlusIcon />
              New role
            </Button>
          </div>
        )}
      </div>

      <RolePermissions
        access={access}
        draft={drafts[selected.name]}
        key={selected.name}
        onChange={permission => setDrafts(current => ({ ...current, [selected.name]: permission }))}
        onDeleted={() => {
          clearDraft(selected.name);
          setSelectedName("");
        }}
        onDiscard={() => clearDraft(selected.name)}
        onSaved={() => clearDraft(selected.name)}
        organizationId={organizationId}
        role={selected}
        vocabulary={vocabulary}
      />

      {isCreating && (
        <CreateRoleSheet
          onCreated={setSelectedName}
          onOpenChange={setIsCreating}
          open={isCreating}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
