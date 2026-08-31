import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { authClient } from "@/features/auth/clients/web-client.ts";

export function LoginForm() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function signIn() {
    setIsRedirecting(true);

    const { error } = await authClient.signIn.sso({
      callbackURL: "/dashboard",
      providerId: "okta",
      providerType: "saml",
    });

    if (error) {
      setIsRedirecting(false);
      toast.error(error.message ?? "Unable to reach Okta. Please try again.");
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Use your okta account to continue
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Button
          className="w-full"
          disabled={isRedirecting}
          onClick={() => void signIn()}
          type="button"
        >
          {isRedirecting
            ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Redirecting…
                </>
              )
            : "Continue with Okta"}
        </Button>
      </CardContent>
    </Card>
  );
}
