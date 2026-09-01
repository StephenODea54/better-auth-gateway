import type { ReactNode } from "react";

import { AppWindowIcon } from "lucide-react";
import { useState } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { LoadError } from "@/components/ui/load-error.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useApplications } from "@/features/applications/api/list-applications.ts";

interface ApplicationScopedPageProps {
  actions?: (organizationId: string) => ReactNode;
  children: (organizationId: string) => ReactNode;
  description: string;
  emptyDescription: string;
  title: string;
  toolbar?: (organizationId: string) => ReactNode;
}

export function ApplicationScopedPage({
  actions,
  children,
  description,
  emptyDescription,
  title,
  toolbar,
}: ApplicationScopedPageProps) {
  const { data: applications, error, isError, isPending, refetch } = useApplications();
  const [selectedId, setSelectedId] = useState("");

  const organizationId = selectedId || applications?.[0]?.id || "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions?.(organizationId)}
      </div>

      {isPending && <Skeleton className="h-9 w-64" />}

      {isError && (
        <LoadError
          className="flex-1"
          message={error.message}
          onRetry={() => void refetch()}
          title="Could not load applications"
        />
      )}

      {applications && applications.length === 0 && (
        <Empty className="flex-1 rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AppWindowIcon />
            </EmptyMedia>
            <EmptyTitle>No applications yet</EmptyTitle>
            <EmptyDescription>{emptyDescription}</EmptyDescription>
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

            {toolbar?.(organizationId)}
          </div>

          {organizationId && children(organizationId)}
        </>
      )}
    </div>
  );
}
