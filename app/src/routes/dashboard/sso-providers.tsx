import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/sso-providers")({
  component: SsoProviders,
  staticData: { section: "Registry", title: "SSO Providers" },
});

export function SsoProviders() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">SSO Providers</h1>
        <p className="text-sm text-muted-foreground">Upstream identity providers that can authenticate members.</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Nothing here yet
      </div>
    </div>
  );
}
