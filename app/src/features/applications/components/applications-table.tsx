import type { TableFeatures } from "@tanstack/react-table";

import {
  createColumnHelper,
  createCoreRowModel,
  createPaginatedRowModel,
  flexRender,
  rowPaginationFeature,
  useTable,
} from "@tanstack/react-table";
import { AppWindowIcon, TriangleAlertIcon } from "lucide-react";

import type { Application } from "@/features/applications/api/list-applications.ts";

import { CopyButton } from "@/components/ui/copy-button.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
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
    header: "Single sign-on URL (ACS)",
  }),
  columnHelper.accessor("audienceUri", {
    cell: info => <CopyButton label="audience URI" value={info.getValue()} />,
    header: "Audience URI",
  }),
  columnHelper.display({
    cell: info => <ApplicationActions application={info.row.original} />,
    header: () => <span className="sr-only">Actions</span>,
    id: "actions",
  }),
]);

export function ApplicationsTable() {
  const { data: applications, error, isError, isPending } = useApplications();

  const table = useTable({
    columns,
    data: applications ?? [],
    features: {
      coreRowModel: createCoreRowModel(),
      paginatedRowModel: createPaginatedRowModel(),
      rowPaginationFeature,
    },
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

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
      <Empty className="flex-1 rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Could not load applications</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (applications.length === 0) {
    return (
      <Empty className="flex-1 rounded-xl border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AppWindowIcon />
          </EmptyMedia>
          <EmptyTitle>No applications yet</EmptyTitle>
          <EmptyDescription>Create one to get started</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const { pageIndex, pageSize } = table.state.pagination;
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, applications.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getAllCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {firstRow}
            –
            {lastRow}
            {" of "}
            {applications.length}
          </p>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  aria-disabled={!table.getCanPreviousPage()}
                  className={table.getCanPreviousPage() ? undefined : "pointer-events-none opacity-50"}
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    table.previousPage();
                  }}
                />
              </PaginationItem>

              {table.getPageOptions().map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === pageIndex}
                    onClick={(event) => {
                      event.preventDefault();
                      table.setPageIndex(page);
                    }}
                  >
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  aria-disabled={!table.getCanNextPage()}
                  className={table.getCanNextPage() ? undefined : "pointer-events-none opacity-50"}
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    table.nextPage();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
