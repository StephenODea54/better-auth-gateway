import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button.tsx";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { useCreateRole } from "@/features/access/api/create-role.ts";

const createRoleFormSchema = z.object({
  role: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, hyphens and underscores."),
});

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
    validators: { onSubmit: createRoleFormSchema },
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
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="analyst"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      The name members are assigned. It starts with nothing granted — pick its
                      permissions once it is created.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button disabled={createRole.isPending} form="create-role" type="submit">
            {createRole.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Creating…
                  </>
                )
              : "Create role"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
