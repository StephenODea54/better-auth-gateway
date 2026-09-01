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
import { RolesPanel } from "@/features/access/components/roles-panel.tsx";
import { useApplications } from "@/features/applications/api/list-applications.ts";

export const Route = createFileRoute("/dashboard/roles")({
  component: Roles,
  staticData: { section: "Access", title: "Roles" },
});

export function Roles() {
  const { data: applications, isPending } = useApplications();
  const [selectedId, setSelectedId] = useState("");

  const organizationId = selectedId || applications?.[0]?.id || "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          A role is a set of granted resource:action pairs.
        </p>
      </div>

      {isPending && <Skeleton className="h-9 w-56" />}

      {applications && applications.length > 0 && (
        <Select onValueChange={setSelectedId} value={organizationId}>
          <SelectTrigger className="w-56">
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
      )}

      {applications && applications.length === 0 && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppWindowIcon />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>
              Register an application before defining the roles that grant access to it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {organizationId && <RolesPanel key={organizationId} organizationId={organizationId} />}
    </div>
  );
}
