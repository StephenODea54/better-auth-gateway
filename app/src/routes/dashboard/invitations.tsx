import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/invitations")({
  component: Invitations,
  staticData: { section: "Directory", title: "Invitations" },
});

export function Invitations() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">Outstanding invitations waiting to be accepted.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
