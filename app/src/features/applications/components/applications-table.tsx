import type { TableFeatures } from "@tanstack/react-table";

import { createColumnHelper } from "@tanstack/react-table";
import { AppWindowIcon } from "lucide-react";

import type { Application } from "@/features/applications/api/list-applications.ts";

import { CopyButton } from "@/components/ui/copy-button.tsx";
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
import { useApplications } from "@/features/applications/api/list-applications.ts";
import { ApplicationActions } from "@/features/applications/components/application-actions.tsx";

const columnHelper = createColumnHelper<TableFeatures, Application>();

const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    cell: info => <span className="font-medium">{info.getValue()}</span>,
    header: "Name",
  }),
  columnHelper.accessor("origin", {
    cell: info => (
      <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
    ),
    header: "Origin",
  }),
  columnHelper.accessor(row => row.ssoProvider.name, {
    cell: info => (
      <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
    ),
    header: "SSO Provider",
    id: "ssoProvider",
  }),
  columnHelper.accessor("acsUrl", {
    cell: info => <CopyButton label="single sign-on URL" value={info.getValue()} />,
    enableSorting: false,
    header: "Single sign-on URL (ACS)",
  }),
  columnHelper.accessor("audienceUri", {
    cell: info => <CopyButton label="audience URI" value={info.getValue()} />,
    enableSorting: false,
    header: "Audience URI",
  }),
  columnHelper.display({
    cell: info => <ApplicationActions application={info.row.original} />,
    header: () => <span className="sr-only">Actions</span>,
    id: "actions",
  }),
]);

export function ApplicationsTable() {
  const { data: applications, error, isError, isPending, refetch } = useApplications();

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
        title="Could not load applications"
      />
    );
  }

  return (
    <DataTable
      columns={columns}
      data={applications}
      emptyState={(
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppWindowIcon />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>Create one to get started</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      enableSortingRemoval={false}
      initialSorting={[{ desc: false, id: "name" }]}
      noMatchesLabel="No applications match"
      searchAriaLabel="Search applications by name"
      searchColumn="name"
      searchPlaceholder="Search by name"
    />
  );
}
