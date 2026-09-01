import { createFileRoute } from "@tanstack/react-router";

import { ApplicationsTable } from "@/features/applications/components/applications-table.tsx";
import { RegisterApplicationSheet } from "@/features/applications/components/register-application-sheet.tsx";

export const Route = createFileRoute("/dashboard/applications")({
  component: Applications,
  staticData: { section: "Registry", title: "Applications" },
});

export function Applications() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Client applications registered with the gateway.</p>
        </div>
        <RegisterApplicationSheet />
      </div>

      <ApplicationsTable />
    </div>
  );
}
