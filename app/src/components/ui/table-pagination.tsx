import { Fragment } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination.tsx";

interface TablePaginationProps {
  matchCount: number;
  onPageChange: (pageIndex: number) => void;
  pageCount: number;
  pageIndex: number;
  pageSize: number;
}

export function TablePagination({
  matchCount,
  onPageChange,
  pageCount,
  pageIndex,
  pageSize,
}: TablePaginationProps) {
  const lastPage = Math.max(pageCount - 1, 0);
  const firstRow = pageIndex * pageSize + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, matchCount);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < lastPage;
  const pages = pageWindow(pageIndex, Math.max(pageCount, 1));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {matchCount === 0
          ? "No results"
          : `${firstRow}–${lastRow} of ${matchCount}`}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={!canPreviousPage}
              className={canPreviousPage ? undefined : "pointer-events-none opacity-50"}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(pageIndex - 1);
              }}
              tabIndex={canPreviousPage ? undefined : -1}
            />
          </PaginationItem>

          {pages.map((page, index) => (
            <Fragment key={page}>
              {index > 0 && page - pages[index - 1] > 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink
                  href="#"
                  isActive={page === pageIndex}
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(page);
                  }}
                >
                  {page + 1}
                </PaginationLink>
              </PaginationItem>
            </Fragment>
          ))}

          <PaginationItem>
            <PaginationNext
              aria-disabled={!canNextPage}
              className={canNextPage ? undefined : "pointer-events-none opacity-50"}
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onPageChange(pageIndex + 1);
              }}
              tabIndex={canNextPage ? undefined : -1}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

function pageWindow(pageIndex: number, pageCount: number) {
  const pages = new Set([0, pageCount - 1]);

  for (let page = pageIndex - 1; page <= pageIndex + 1; page++) {
    if (page >= 0 && page < pageCount) {
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b);
}
