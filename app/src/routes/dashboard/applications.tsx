import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { ApplicationSheet } from "@/features/applications/components/application-sheet.tsx";
import { ApplicationsTable } from "@/features/applications/components/applications-table.tsx";

export const Route = createFileRoute("/dashboard/applications")({
  component: Applications,
  staticData: { section: "Registry", title: "Applications" },
});

export function Applications() {
  const { session } = useLoaderData({ from: "/dashboard" });
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
          <p className="text-sm text-muted-foreground">Client applications registered with the gateway.</p>
        </div>
        {session.isSuperAdmin && (
          <Button onClick={() => setIsRegistering(true)}>
            <PlusIcon />
            Register Application
          </Button>
        )}
      </div>

      <ApplicationsTable />

      {isRegistering && (
        <ApplicationSheet onOpenChange={setIsRegistering} open={isRegistering} />
      )}
    </div>
  );
}
