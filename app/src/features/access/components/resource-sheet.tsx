import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import type { Resource } from "@/features/access/api/list-resources.ts";

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
import { Textarea } from "@/components/ui/textarea.tsx";
import { useCreateResource } from "@/features/access/api/create-resource.ts";

const IDENTIFIER = /^[a-z0-9][a-z0-9_-]*$/;

function parseActions(value: string): string[] {
  return value.split("\n").map(line => line.trim()).filter(Boolean);
}

const createResourceFormSchema = z.object({
  actions: z
    .string()
    .refine(value => parseActions(value).length > 0, "Add at least one action.")
    .refine(
      value => parseActions(value).every(action => IDENTIFIER.test(action)),
      "Use lowercase letters, numbers, hyphens and underscores.",
    ),
  key: z
    .string()
    .min(1, "Required")
    .regex(IDENTIFIER, "Use lowercase letters, numbers, hyphens and underscores."),
});

interface ResourceSheetProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationId: string;
  resource?: Resource;
}

export function ResourceSheet({ onOpenChange, open, organizationId, resource }: ResourceSheetProps) {
  const createResource = useCreateResource({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (saved) => {
        toast.success(`${saved.key} was saved.`);
      },
    },
    organizationId,
  });

  const form = useForm({
    defaultValues: {
      actions: resource?.actions.join("\n") ?? "",
      key: resource?.key ?? "",
    },
    onSubmit: async ({ formApi, value }) => {
      try {
        await createResource.mutateAsync({
          data: {
            actions: parseActions(value.actions),
            key: value.key.trim(),
            organizationId,
          },
        });
      }
      catch {
        return;
      }

      onOpenChange(false);
      formApi.reset();
    },
    validators: { onSubmit: createResourceFormSchema },
  });

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{resource ? `Edit ${resource.key}` : "Add resource"}</SheetTitle>
        </SheetHeader>

        <form
          className="flex-1 overflow-y-auto"
          id="create-resource"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="px-4">
            <form.Field name="key">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Resource</FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      className="font-mono"
                      disabled={Boolean(resource)}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="invoice"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      {resource
                        ? "The resource key cannot be changed once roles are granted against it."
                        : "The name the application uses for this thing, for example invoice."}
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="actions">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Actions</FieldLabel>
                    <Textarea
                      aria-invalid={isInvalid}
                      className="field-sizing-fixed font-mono text-xs"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder={"read\napprove\nvoid"}
                      rows={8}
                      value={field.state.value}
                    />
                    <FieldDescription>
                      One per line. Removing an action here also revokes it from every role that
                      was granted it.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button disabled={createResource.isPending} form="create-resource" type="submit">
            {createResource.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving…
                  </>
                )
              : "Save resource"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
