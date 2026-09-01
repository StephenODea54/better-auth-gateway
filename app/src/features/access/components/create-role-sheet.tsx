import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import { FieldGroup } from "@/components/ui/field.tsx";
import { LoadingButton } from "@/components/ui/loading-button.tsx";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { TextField } from "@/components/ui/text-field.tsx";
import { createRoleInputSchema, useCreateRole } from "@/features/access/api/create-role.ts";

interface CreateRoleSheetProps {
  onCreated: (role: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
}

export function CreateRoleSheet({ onCreated, onOpenChange, open, organizationId }: CreateRoleSheetProps) {
  const createRole = useCreateRole({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (created) => {
        toast.success(`${created.role} was created.`);
        onCreated(created.role);
      },
    },
    organizationId,
  });

  const form = useForm({
    defaultValues: { role: "" },
    onSubmit: async ({ formApi, value }) => {
      try {
        await createRole.mutateAsync({
          data: { organizationId, role: value.role.trim() },
        });
      }
      catch {
        return;
      }

      onOpenChange(false);
      formApi.reset();
    },
    validators: { onSubmit: createRoleInputSchema.omit({ organizationId: true }) },
  });

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>New role</SheetTitle>
        </SheetHeader>

        <form
          className="flex-1 overflow-y-auto"
          id="create-role"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="px-4">
            <form.Field name="role">
              {field => (
                <TextField
                  description="The name members are assigned. It starts with nothing granted; pick its permissions once it is created."
                  field={field}
                  label="Role"
                  placeholder="analyst"
                />
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <SheetFooter>
          <LoadingButton
            form="create-role"
            isPending={createRole.isPending}
            pendingLabel="Creating…"
            type="submit"
          >
            Create role
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
