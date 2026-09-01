import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
import { cn } from "@/lib/utils.ts";

interface LoadErrorProps {
  className?: string;
  message: string;
  onRetry: () => void;
  title: string;
}

export function LoadError({ className, message, onRetry, title }: LoadErrorProps) {
  return (
    <Empty className={cn("rounded-xl border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry} variant="outline">
          <RefreshCwIcon />
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}
