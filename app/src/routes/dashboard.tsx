import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { authClient } from "@/features/auth/clients/web-client.ts";

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
  const router = useRouter();
  const { session } = Route.useLoaderData();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Signed in</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            onClick={async () => {
              await authClient.signOut();
              await router.invalidate();
            }}
            variant="outline"
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
