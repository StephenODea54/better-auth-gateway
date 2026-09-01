import type { ColumnDef, RowData, SortingState, TableFeatures } from "@tanstack/react-table";
import type { ReactNode } from "react";

import {
  columnFilteringFeature,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  flexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_datetime,
  sortFn_text,
  useTable,
} from "@tanstack/react-table";
import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input.tsx";
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

interface DataTableProps<TData extends RowData> {
  columns: Array<ColumnDef<TableFeatures, TData, any>>;
  data: TData[];
  emptyState: ReactNode;
  enableSortingRemoval?: boolean;
  headWidths?: Record<string, string>;
  initialSorting?: SortingState;
  noMatchesLabel: string;
  searchAriaLabel: string;
  searchColumn: string;
  searchPlaceholder: string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyState,
  enableSortingRemoval,
  headWidths,
  initialSorting,
  noMatchesLabel,
  searchAriaLabel,
  searchColumn,
  searchPlaceholder,
}: DataTableProps<TData>) {
  const table = useTable({
    columns,
    data,
    enableSortingRemoval,
    features: {
      columnFilteringFeature,
      coreRowModel: createCoreRowModel(),
      filteredRowModel: createFilteredRowModel(),
      filterFns: { includesString: filterFn_includesString },
      paginatedRowModel: createPaginatedRowModel(),
      rowPaginationFeature,
      rowSortingFeature,
      sortedRowModel: createSortedRowModel(),
      sortFns: { datetime: sortFn_datetime, text: sortFn_text },
    },
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      ...initialSorting && { sorting: initialSorting },
    },
  });

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  const filterColumn = table.getColumn(searchColumn);
  const search = (filterColumn?.getFilterValue() as string | undefined) ?? "";
  const rows = table.getRowModel().rows;
  const matchCount = table.getPrePaginatedRowModel().rows.length;
  const { pageIndex, pageSize } = table.state.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label={searchAriaLabel}
          className="pl-9"
          onChange={event => filterColumn?.setFilterValue(event.target.value)}
          placeholder={searchPlaceholder}
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
                    className={headWidths?.[header.column.id]}
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
                      {noMatchesLabel}
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
