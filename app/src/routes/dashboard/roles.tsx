import { createFileRoute } from "@tanstack/react-router";

import { RolesPanel } from "@/features/access/components/roles-panel.tsx";
import { ApplicationScopedPage } from "@/features/applications/components/application-scoped-page.tsx";

export const Route = createFileRoute("/dashboard/roles")({
  component: Roles,
  staticData: { section: "Access", title: "Roles" },
});

export function Roles() {
  return (
    <ApplicationScopedPage
      description="A role is a set of granted resource:action pairs."
      emptyDescription="Register an application before defining the roles that grant access to it."
      title="Roles"
    >
      {organizationId => <RolesPanel key={organizationId} organizationId={organizationId} />}
    </ApplicationScopedPage>
  );
}
