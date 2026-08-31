import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/permissions")({
  component: Permissions,
  staticData: { section: "Access", title: "Permissions and Resources" },
});

export function Permissions() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Permissions and Resources</h1>
        <p className="text-sm text-muted-foreground">Resources exposed by applications and the actions allowed on them.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
