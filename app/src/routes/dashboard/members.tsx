import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { ApplicationScopedPage } from "@/features/applications/components/application-scoped-page.tsx";
import { SuperAdminsSheet } from "@/features/auth/components/super-admins-sheet.tsx";
import { AddMemberSheet } from "@/features/members/components/add-member-sheet.tsx";
import { MembersTable } from "@/features/members/components/members-table.tsx";

export const Route = createFileRoute("/dashboard/members")({
  component: Members,
  staticData: { section: "Directory", title: "Members" },
});

export function Members() {
  const { session } = useLoaderData({ from: "/dashboard" });

  return (
    <ApplicationScopedPage
      actions={() => session.isSuperAdmin && <SuperAdminsSheet currentUserId={session.user.id} />}
      description="People who can sign in to an application, and the roles they hold there."
      emptyDescription="Register an application before managing the people who can reach it."
      title="Members"
      toolbar={organizationId => (
        <AddMemberSheet key={organizationId} organizationId={organizationId} />
      )}
    >
      {organizationId => <MembersTable key={organizationId} organizationId={organizationId} />}
    </ApplicationScopedPage>
  );
}
