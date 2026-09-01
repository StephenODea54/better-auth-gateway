import { Link } from "@tanstack/react-router";
import { FileQuestionMarkIcon } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";

export function RouteNotFound() {
  return (
    <Empty className="flex-1 rounded-xl border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestionMarkIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          This page does not exist, or it has moved somewhere else.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link to="/dashboard">Go to dashboard</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
