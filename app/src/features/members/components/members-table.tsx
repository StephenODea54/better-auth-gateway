import type { TableFeatures } from "@tanstack/react-table";

import { createColumnHelper } from "@tanstack/react-table";
import { UsersIcon } from "lucide-react";
import { useMemo } from "react";

import type { Member } from "@/features/members/api/list-members.ts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { DataTable } from "@/components/ui/data-table.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { LoadError } from "@/components/ui/load-error.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useMembers } from "@/features/members/api/list-members.ts";
import { MemberActions } from "@/features/members/components/member-actions.tsx";

const columnHelper = createColumnHelper<TableFeatures, Member>();

const joined = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface MembersTableProps {
  organizationId: string;
}

export function MembersTable({ organizationId }: MembersTableProps) {
  const { data: members, error, isError, isPending, refetch } = useMembers({ organizationId });

  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor("name", {
      cell: info => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage alt={info.getValue()} src={info.row.original.image ?? undefined} />
            <AvatarFallback>{info.getValue().slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 leading-tight">
            <span className="truncate font-medium">{info.getValue()}</span>
            <span className="truncate text-xs text-muted-foreground">
              {info.row.original.email}
            </span>
          </div>
        </div>
      ),
      filterFn: (row, _columnId, filterValue: string) => {
        const term = filterValue.trim().toLowerCase();

        return row.original.name.toLowerCase().includes(term)
          || row.original.email.toLowerCase().includes(term);
      },
      header: "Member",
    }),
    columnHelper.accessor("roles", {
      cell: info => (
        <div className="flex flex-wrap gap-1">
          {info.row.original.isSuperAdmin && (
            <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
              super admin
            </span>
          )}
          {info.getValue().map(role => (
            <span
              className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              key={role}
            >
              {role}
            </span>
          ))}
        </div>
      ),
      enableSorting: false,
      header: "Roles",
    }),
    columnHelper.accessor("createdAt", {
      cell: info => (
        <span className="text-sm text-muted-foreground">
          {joined.format(new Date(info.getValue()))}
        </span>
      ),
      header: "Joined",
    }),
    columnHelper.display({
      cell: info => (
        <MemberActions member={info.row.original} organizationId={organizationId} />
      ),
      header: () => <span className="sr-only">Actions</span>,
      id: "actions",
    }),
  ]), [organizationId]);

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <LoadError
        className="flex-1"
        message={error.message}
        onRetry={() => void refetch()}
        title="Could not load members"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={members}
      emptyState={(
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyTitle>No members yet</EmptyTitle>
            <EmptyDescription>
              Add someone who has signed in to the gateway, and pick the roles they hold here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      enableSortingRemoval={false}
      initialSorting={[{ desc: false, id: "name" }]}
      noMatchesLabel="No members match"
      searchAriaLabel="Search members by name or email"
      searchColumn="name"
      searchPlaceholder="Search by name or email"
    />
  );
}
