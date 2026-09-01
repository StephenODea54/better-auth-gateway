import type { TableFeatures } from "@tanstack/react-table";

import {
  columnFilteringFeature,
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  useTable,
} from "@tanstack/react-table";
import { SearchIcon, TriangleAlertIcon, UsersIcon } from "lucide-react";
import { useMemo } from "react";

import type { Member } from "@/features/members/api/list-members.ts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Input } from "@/components/ui/input.tsx";
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
  const { data: members, error, isError, isPending } = useMembers({ organizationId });

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
      header: "Member",
    }),
    columnHelper.accessor("roles", {
      cell: info => (
        <div className="flex flex-wrap gap-1">
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
    features: {
      columnFilteringFeature,
      coreRowModel: createCoreRowModel(),
      filteredRowModel: createFilteredRowModel(),
      filterFns: { includesString: filterFn_includesString },
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
          <EmptyTitle>Could not load members</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
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
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, matchCount);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search members by name"
          className="pl-9"
          onChange={event => nameColumn?.setFilterValue(event.target.value)}
          placeholder="Search by name"
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
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
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

      {table.getPageCount() > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {firstRow}
            –
            {lastRow}
            {" of "}
            {matchCount}
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
