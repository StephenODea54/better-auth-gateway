import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button.tsx";
import { useAccess } from "@/features/access/api/get-access.ts";
import { ResourceSheet } from "@/features/access/components/resource-sheet.tsx";
import { ResourcesTable } from "@/features/access/components/resources-table.tsx";
import { ApplicationScopedPage } from "@/features/applications/components/application-scoped-page.tsx";

export const Route = createFileRoute("/dashboard/permissions")({
  component: Permissions,
  staticData: { section: "Access", title: "Permissions and Resources" },
});

export function Permissions() {
  return (
    <ApplicationScopedPage
      actions={organizationId => <AddResourceAction organizationId={organizationId} />}
      description="Resources exposed by applications and the actions allowed on them."
      emptyDescription="Register an application before defining the resources it protects."
      title="Permissions and Resources"
    >
      {organizationId => <ResourcesTable organizationId={organizationId} />}
    </ApplicationScopedPage>
  );
}

function AddResourceAction({ organizationId }: { organizationId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const { data: access } = useAccess({ organizationId });

  return (
    <>
      {access?.canCreate && (
        <Button onClick={() => setIsAdding(true)}>
          <PlusIcon />
          Add Resource
        </Button>
      )}

      {isAdding && (
        <ResourceSheet
          onOpenChange={setIsAdding}
          open={isAdding}
          organizationId={organizationId}
        />
      )}
    </>
  );
}
