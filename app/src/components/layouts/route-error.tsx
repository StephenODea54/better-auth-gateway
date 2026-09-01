import type { ErrorComponentProps } from "@tanstack/react-router";

import { useRouter } from "@tanstack/react-router";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";

export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Empty className="flex-1 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>{error.message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          onClick={() => {
            reset();
            void router.invalidate();
          }}
          variant="outline"
        >
          <RefreshCwIcon />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
