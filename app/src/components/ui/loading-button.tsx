import type { ComponentProps } from "react";

import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";

type LoadingButtonProps = {
  isPending: boolean;
  pendingLabel: string;
} & ComponentProps<typeof Button>;

export function LoadingButton({ children, isPending, pendingLabel, ...props }: LoadingButtonProps) {
  return (
    <Button {...props} disabled={isPending || props.disabled}>
      {isPending
        ? (
            <>
              <Loader2Icon className="animate-spin" />
              {pendingLabel}
            </>
          )
        : children}
    </Button>
  );
}
