import { createFileRoute } from "@tanstack/react-router";

import { ActivityTable } from "@/features/activity/components/activity-table.tsx";
import { ApplicationScopedPage } from "@/features/applications/components/application-scoped-page.tsx";

export const Route = createFileRoute("/dashboard/activity")({
  component: Activity,
  staticData: { section: "Audit", title: "Activity" },
});

export function Activity() {
  return (
    <ApplicationScopedPage
      description="Every change made to an application, and every attempt that was turned away."
      emptyDescription="Register an application before reviewing what has happened to it."
      title="Activity"
    >
      {organizationId => <ActivityTable key={organizationId} organizationId={organizationId} />}
    </ApplicationScopedPage>
  );
}
