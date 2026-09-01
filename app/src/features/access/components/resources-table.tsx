import type { TableFeatures } from "@tanstack/react-table";

import { createColumnHelper } from "@tanstack/react-table";
import { LockKeyholeIcon } from "lucide-react";
import { useMemo } from "react";

import type { Resource } from "@/features/access/api/list-resources.ts";

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
import { useAccess } from "@/features/access/api/get-access.ts";
import { useResources } from "@/features/access/api/list-resources.ts";
import { ResourceActions } from "@/features/access/components/resource-actions.tsx";

const columnHelper = createColumnHelper<TableFeatures, Resource>();

const headWidths: Record<string, string> = {
  key: "w-56",
  rowActions: "w-12",
};

interface ResourcesTableProps {
  organizationId: string;
}

export function ResourcesTable({ organizationId }: ResourcesTableProps) {
  const { data: resources, error, isError, isPending, refetch } = useResources({ organizationId });
  const { data: access } = useAccess({ organizationId });

  const columns = useMemo(() => columnHelper.columns([
    columnHelper.accessor("key", {
      cell: info => <span className="font-mono text-sm font-medium">{info.getValue()}</span>,
      header: "Resource",
    }),
    columnHelper.accessor("actions", {
      cell: info => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().map(action => (
            <span
              className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              key={action}
            >
              {action}
            </span>
          ))}
        </div>
      ),
      enableSorting: false,
      header: "Actions",
    }),
    ...access && (access.canCreate || access.canDelete)
      ? [columnHelper.display({
          cell: info => (
            <ResourceActions
              access={access}
              organizationId={organizationId}
              resource={info.row.original}
            />
          ),
          header: () => <span className="sr-only">Actions</span>,
          id: "rowActions",
        })]
      : [],
  ]), [access, organizationId]);

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
        title="Could not load resources"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={resources}
      emptyState={(
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockKeyholeIcon />
            </EmptyMedia>
            <EmptyTitle>No resources yet</EmptyTitle>
            {access?.canCreate && (
              <EmptyDescription>
                Create one to get started
              </EmptyDescription>
            )}
          </EmptyHeader>
        </Empty>
      )}
      headWidths={headWidths}
      noMatchesLabel="No resources match"
      searchAriaLabel="Search resources by name"
      searchColumn="key"
      searchPlaceholder="Search by resource"
    />
  );
}
