import { createFileRoute } from "@tanstack/react-router";
import { AppWindowIcon } from "lucide-react";
import { useState } from "react";

import {
  Empty,
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
import { useApplications } from "@/features/applications/api/list-applications.ts";
import { MembersTable } from "@/features/members/components/members-table.tsx";

export const Route = createFileRoute("/dashboard/members")({
  component: Members,
  staticData: { section: "Directory", title: "Members" },
});

export function Members() {
  const { data: applications, isPending } = useApplications();
  const [selectedId, setSelectedId] = useState("");

  const organizationId = selectedId || applications?.[0]?.id || "";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          People who can sign in to an application, and the roles they hold there.
        </p>
      </div>

      {isPending && <Skeleton className="h-9 w-64" />}

      {applications && applications.length === 0 && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppWindowIcon />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>
              Register an application before managing the people who can reach it.
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

          <MembersTable key={organizationId} organizationId={organizationId} />
        </>
      )}
    </div>
  );
}
