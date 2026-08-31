import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/applications")({
  component: Applications,
  staticData: { section: "Registry", title: "Applications" },
});

export function Applications() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground">Client applications registered with the gateway.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
