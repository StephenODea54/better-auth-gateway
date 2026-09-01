import { RefreshCwIcon, ScrollTextIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { useDebounceValue } from "usehooks-ts";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { TablePagination } from "@/components/ui/table-pagination.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { EVENT_KINDS, PAGE_SIZE, useEvents } from "@/features/activity/api/list-events.ts";

const ALL_KINDS = "all";

const occurred = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

interface ActivityTableProps {
  organizationId: string;
}

export function ActivityTable({ organizationId }: ActivityTableProps) {
  const [kind, setKind] = useState(ALL_KINDS);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, 300);

  const { data, error, isError, isPending, refetch } = useEvents({
    input: {
      kind: kind === ALL_KINDS ? undefined : kind,
      organizationId,
      page,
      search: debouncedSearch || undefined,
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Filter activity by who performed it"
            className="pl-8"
            onChange={(event) => {
              setPage(0);
              setSearch(event.target.value);
            }}
            placeholder="Filter by email"
            value={search}
          />
        </div>

        <Select
          onValueChange={(value) => {
            setPage(0);
            setKind(value);
          }}
          value={kind}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_KINDS}>All activity</SelectItem>
            {EVENT_KINDS.map(eventKind => (
              <SelectItem key={eventKind} value={eventKind}>
                {eventKind}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && <Skeleton className="h-64 w-full rounded-xl" />}

      {isError && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load activity</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => void refetch()} variant="outline">
              <RefreshCwIcon />
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      )}

      {data && data.rows.length === 0 && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScrollTextIcon />
            </EmptyMedia>
            <EmptyTitle>Nothing recorded yet</EmptyTitle>
            <EmptyDescription>
              Changes to this application&apos;s members, roles and resources will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && data.rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>What</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map(row => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {occurred.format(row.occurredAt)}
                    </TableCell>
                    <TableCell>{row.actorEmail ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {row.kind ?? row.handlerName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.denied || row.errorCause
                        ? (
                            <span className="rounded-md border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-xs text-destructive">
                              {row.denied ? "denied" : row.errorCause}
                            </span>
                          )
                        : (
                            <span className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {row.httpStatus}
                            </span>
                          )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            matchCount={data.matchCount}
            onPageChange={setPage}
            pageCount={Math.ceil(data.matchCount / PAGE_SIZE)}
            pageIndex={page}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
