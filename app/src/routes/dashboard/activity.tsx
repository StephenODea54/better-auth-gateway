import { createFileRoute } from "@tanstack/react-router";
import { AppWindowIcon, RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
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
import { ActivityTable } from "@/features/activity/components/activity-table.tsx";
import { useApplications } from "@/features/applications/api/list-applications.ts";

export const Route = createFileRoute("/dashboard/activity")({
  component: Activity,
  staticData: { section: "Audit", title: "Activity" },
});

export function Activity() {
  const { data: applications, error, isError, isPending, refetch } = useApplications();
  const [selectedId, setSelectedId] = useState("");

  const organizationId = selectedId || applications?.[0]?.id || "";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          Every change made to an application, and every attempt that was turned away.
        </p>
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
              Register an application before reviewing what has happened to it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {applications && applications.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
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

          </div>

          <ActivityTable key={organizationId} organizationId={organizationId} />
        </>
      )}
    </div>
  );
}
