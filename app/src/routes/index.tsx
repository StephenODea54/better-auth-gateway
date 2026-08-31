import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginForm } from "@/features/auth/components/login-form.tsx";

export const Route = createFileRoute("/")({
  component: Home,
  loader: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

export function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6">
      <LoginForm />
    </main>
  );
}
