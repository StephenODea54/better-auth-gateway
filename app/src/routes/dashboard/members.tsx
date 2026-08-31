import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/members")({
  component: Members,
  staticData: { section: "Directory", title: "Members" },
});

export function Members() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">People with access to the gateway.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
