import { useForm } from "@tanstack/react-form";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import type { Application } from "@/features/applications/api/list-applications.ts";

import { Button } from "@/components/ui/button.tsx";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
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
import { updateApplicationInputSchema, useUpdateApplication } from "@/features/applications/api/update-application.ts";

interface EditApplicationSheetProps {
  application: Application;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function EditApplicationSheet({ application, onOpenChange, open }: EditApplicationSheetProps) {
  const updateApplication = useUpdateApplication({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (updated) => {
        toast.success(`${updated.name} was updated.`);
      },
    },
  });

  const form = useForm({
    defaultValues: {
      certificate: application.ssoProvider.certificate,
      domain: application.ssoProvider.domain,
      entityId: application.ssoProvider.entityId,
      entryPoint: application.ssoProvider.entryPoint,
      name: application.name,
      origin: application.origin,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateApplication.mutateAsync({
          data: {
            certificate: value.certificate.trim(),
            domain: value.domain.trim(),
            entityId: value.entityId.trim(),
            entryPoint: value.entryPoint.trim(),
            id: application.id,
            name: value.name.trim(),
            origin: value.origin.trim(),
          },
        });
      }
      catch {
        return;
      }

      onOpenChange(false);
    },
    validators: { onSubmit: updateApplicationInputSchema.omit({ id: true }) },
  });

  function toggle(nextOpen: boolean) {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      form.reset();
    }
  }

  return (
    <Sheet onOpenChange={toggle} open={open}>
      <SheetContent className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edit Application</SheetTitle>
        </SheetHeader>

        <form
          className="flex-1 overflow-y-auto"
          id="edit-application"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="px-4">
            <FieldSet>
              <FieldLegend variant="label">Application</FieldLegend>

              <form.Field name="name">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="Billing Portal"
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="origin">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Origin</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="https://billing.acme.com"
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Okta connection</FieldLegend>

              <form.Field name="domain">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email domain</FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="acme.com"
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="entryPoint">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Identity provider single sign-on URL
                      </FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="https://acme.okta.com/app/exk1.../sso/saml"
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="entityId">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Identity provider issuer
                      </FieldLabel>
                      <Input
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="http://www.okta.com/exk1..."
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field name="certificate">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        X.509 signing certificate
                      </FieldLabel>
                      <Textarea
                        aria-invalid={isInvalid}
                        className="field-sizing-fixed font-mono text-xs"
                        id={field.name}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={event => field.handleChange(event.target.value)}
                        placeholder="-----BEGIN CERTIFICATE-----"
                        rows={8}
                        value={field.state.value}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>

            </FieldSet>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button
            disabled={updateApplication.isPending}
            form="edit-application"
            type="submit"
          >
            {updateApplication.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving…
                  </>
                )
              : "Save changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
