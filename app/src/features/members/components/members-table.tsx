import type { TableFeatures } from "@tanstack/react-table";

import {
  columnFilteringFeature,
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_datetime,
  sortFn_text,
  useTable,
} from "@tanstack/react-table";
import { RefreshCwIcon, SearchIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { useMemo } from "react";

import type { Member } from "@/features/members/api/list-members.ts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
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

  const table = useTable({
    columns,
    data: members ?? [],
    enableSortingRemoval: false,
    features: {
      columnFilteringFeature,
      coreRowModel: createCoreRowModel(),
      filteredRowModel: createFilteredRowModel(),
      paginatedRowModel: createPaginatedRowModel(),
      rowPaginationFeature,
      rowSortingFeature,
      sortedRowModel: createSortedRowModel(),
      sortFns: { datetime: sortFn_datetime, text: sortFn_text },
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [{ desc: false, id: "name" }],
    },
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
          <EmptyTitle>Could not load members</EmptyTitle>
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

  if (members.length === 0) {
    return (
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
    );
  }

  const nameColumn = table.getColumn("name");
  const search = (nameColumn?.getFilterValue() as string | undefined) ?? "";
  const rows = table.getRowModel().rows;
  const matchCount = table.getPrePaginatedRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search members by name or email"
          className="pl-9"
          onChange={event => nameColumn?.setFilterValue(event.target.value)}
          placeholder="Search by name or email"
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
                      No members match
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
