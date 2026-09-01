import { useLoaderData } from "@tanstack/react-router";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { useSignIn } from "@/features/auth/api/sign-in.ts";

export function LoginForm() {
  const { ssoProviderId, ssoProviderName } = useLoaderData({ from: "__root__" });

  const signIn = useSignIn({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
    },
  });

  const isRedirecting = signIn.isPending || signIn.isSuccess;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Use your
          {" "}
          {ssoProviderName}
          {" "}
          account to continue
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          className="w-full"
          disabled={isRedirecting}
          onClick={() => signIn.mutate(ssoProviderId)}
          type="button"
        >
          {isRedirecting
            ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Redirecting…
                </>
              )
            : `Continue with ${ssoProviderName}`}
        </Button>
      </CardContent>
    </Card>
  );
}
