import { createFileRoute } from "@tanstack/react-router";
import { AppWindowIcon, PlusIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { ResourceSheet } from "@/features/access/components/resource-sheet.tsx";
import { ResourcesTable } from "@/features/access/components/resources-table.tsx";
import { useApplications } from "@/features/applications/api/list-applications.ts";

export const Route = createFileRoute("/dashboard/permissions")({
  component: Permissions,
  staticData: { section: "Access", title: "Permissions and Resources" },
});

export function Permissions() {
  const { data: applications, error, isError, isPending, refetch } = useApplications();
  const [selectedId, setSelectedId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const organizationId = selectedId || applications?.[0]?.id || "";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Permissions and Resources</h1>
          <p className="text-sm text-muted-foreground">Resources exposed by applications and the actions allowed on them.</p>
        </div>

        {organizationId && (
          <Button onClick={() => setIsAdding(true)}>
            <PlusIcon />
            Add Resource
          </Button>
        )}
      </div>

      {isPending && <Skeleton className="h-9 w-64" />}

      {isError && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>Could not load applications</EmptyTitle>
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

      {applications && applications.length === 0 && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppWindowIcon />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>
              Register an application before defining the resources it protects.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {applications && applications.length > 0 && (
        <>
          <Select onValueChange={setSelectedId} value={organizationId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select an application" />
            </SelectTrigger>
            <SelectContent>
              {applications.map(application => (
                <SelectItem key={application.id} value={application.id}>
                  {application.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ResourcesTable organizationId={organizationId} />
        </>
      )}

      {isAdding && (
        <ResourceSheet
          onOpenChange={setIsAdding}
          open={isAdding}
          organizationId={organizationId}
        />
      )}
    </div>
  );
}
