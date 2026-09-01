import type { TableFeatures } from "@tanstack/react-table";

import {
  columnFilteringFeature,
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_text,
  useTable,
} from "@tanstack/react-table";
import {
  LockKeyholeIcon,
  RefreshCwIcon,
  SearchIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useMemo } from "react";

import type { Resource } from "@/features/access/api/list-resources.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ariaSort, SortableHeader } from "@/components/ui/sortable-header.tsx";
import { TablePagination } from "@/components/ui/table-pagination.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
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

  const table = useTable({
    columns,
    data: resources ?? [],
    features: {
      columnFilteringFeature,
      coreRowModel: createCoreRowModel(),
      filteredRowModel: createFilteredRowModel(),
      filterFns: { includesString: filterFn_includesString },
      paginatedRowModel: createPaginatedRowModel(),
      rowPaginationFeature,
      rowSortingFeature,
      sortedRowModel: createSortedRowModel(),
      sortFns: { text: sortFn_text },
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
          <EmptyTitle>Could not load resources</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => void refetch()} variant="outline">
            <RefreshCwIcon />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (resources.length === 0) {
    return (
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
    );
  }

  const keyColumn = table.getColumn("key");
  const search = (keyColumn?.getFilterValue() as string | undefined) ?? "";
  const rows = table.getRowModel().rows;
  const matchCount = table.getPrePaginatedRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search resources by name"
          className="pl-9"
          onChange={event => keyColumn?.setFilterValue(event.target.value)}
          placeholder="Search by resource"
          type="search"
          value={search}
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead
                    aria-sort={header.column.getCanSort() ? ariaSort(header.column.getIsSorted()) : undefined}
                    className={headWidths[header.column.id]}
                    key={header.id}
                  >
                    {header.column.getCanSort()
                      ? (
                          <SortableHeader
                            onToggle={header.column.getToggleSortingHandler()}
                            sorted={header.column.getIsSorted()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </SortableHeader>
                        )
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0
              ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-sm text-muted-foreground" colSpan={columns.length}>
                      No resources match
                      {" "}
                      <span className="font-medium text-foreground">{search}</span>
                    </TableCell>
                  </TableRow>
                )
              : rows.map(row => (
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

      <TablePagination
        matchCount={matchCount}
        onPageChange={page => table.setPageIndex(page)}
        pageCount={table.getPageCount()}
        pageIndex={pageIndex}
        pageSize={pageSize}
      />
    </div>
  );
}
