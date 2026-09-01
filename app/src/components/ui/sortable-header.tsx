import type { SortDirection } from "@tanstack/react-table";
import type { ReactNode } from "react";

import { ArrowDownAZIcon, ArrowDownZAIcon, ArrowUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";

export function ariaSort(sorted: false | SortDirection) {
  if (sorted === "asc") {
    return "ascending";
  }

  if (sorted === "desc") {
    return "descending";
  }

  return "none";
}

export function SortableHeader({
  children,
  onToggle,
  sorted,
}: {
  children: ReactNode;
  onToggle: ((event: unknown) => void) | undefined;
  sorted: false | SortDirection;
}) {
  return (
    <Button
      className={cn(
        "-mx-2 h-8 px-2 font-medium",
        sorted ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={onToggle}
      size="sm"
      variant="ghost"
    >
      {children}
      {sorted === "asc" && <ArrowDownAZIcon className="text-primary" />}
      {sorted === "desc" && <ArrowDownZAIcon className="text-primary" />}
      {sorted === false && <ArrowUpDownIcon className="opacity-50" />}
    </Button>
  );
}
