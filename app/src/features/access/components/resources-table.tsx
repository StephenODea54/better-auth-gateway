import { LockKeyholeIcon, TriangleAlertIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { useResources } from "@/features/access/api/list-resources.ts";
import { ResourceActions } from "@/features/access/components/resource-actions.tsx";

interface ResourcesTableProps {
  organizationId: string;
}

export function ResourcesTable({ organizationId }: ResourcesTableProps) {
  const { data: resources, error, isError, isPending } = useResources({ organizationId });

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
          <EmptyDescription>
            Create one to get started
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-56">Resource</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map(resource => (
            <TableRow key={resource.key}>
              <TableCell className="font-mono text-sm font-medium">{resource.key}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {resource.actions.map(action => (
                    <span
                      className="rounded-md border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
                      key={action}
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <ResourceActions organizationId={organizationId} resource={resource} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
