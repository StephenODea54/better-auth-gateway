import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/roles")({
  component: Roles,
  staticData: { section: "Access", title: "Roles" },
});

export function Roles() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">Bundles of permissions that can be assigned to members.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
