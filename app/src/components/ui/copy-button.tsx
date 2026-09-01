import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useCopyToClipboard } from "usehooks-ts";

import { Button } from "@/components/ui/button.tsx";

interface CopyButtonProps {
  label: string;
  value: string;
}

export function CopyButton({ label, value }: CopyButtonProps) {
  const [copiedValue, copyToClipboard] = useCopyToClipboard();
  const isCopied = copiedValue === value;

  async function copy() {
    if (!await copyToClipboard(value)) {
      toast.error(`Could not copy the ${label}.`);
    }
  }

  return (
    <Button
      onClick={() => void copy()}
      size="xs"
      title={value}
      type="button"
      variant="outline"
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
      {isCopied ? "Copied" : "Copy"}
    </Button>
  );
}
