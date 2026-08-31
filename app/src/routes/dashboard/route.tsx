import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/layouts/dashboard-layout.tsx";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  loader: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/" });
    }

    return { session: context.session };
  },
});

export function Dashboard() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
