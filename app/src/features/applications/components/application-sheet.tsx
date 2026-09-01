import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import type { Application } from "@/features/applications/api/list-applications.ts";

import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field.tsx";
import { LoadingButton } from "@/components/ui/loading-button.tsx";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet.tsx";
import { TextField } from "@/components/ui/text-field.tsx";
import { registerApplicationInputSchema, useRegisterApplication } from "@/features/applications/api/register-application.ts";
import { updateApplicationInputSchema, useUpdateApplication } from "@/features/applications/api/update-application.ts";

interface ApplicationSheetProps {
  application?: Application;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ApplicationSheet({ application, onOpenChange, open }: ApplicationSheetProps) {
  const registerApplication = useRegisterApplication({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (registered) => {
        toast.success(`${registered.name} was registered.`, {
          description: "Copy its sign-on URL and audience URI from the table into your identity provider.",
        });
      },
    },
  });

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
      certificate: application?.ssoProvider.certificate ?? "",
      domain: application?.ssoProvider.domain ?? "",
      emailAttribute: application?.ssoProvider.emailAttribute ?? "",
      entityId: application?.ssoProvider.entityId ?? "",
      entryPoint: application?.ssoProvider.entryPoint ?? "",
      firstNameAttribute: application?.ssoProvider.firstNameAttribute ?? "",
      lastNameAttribute: application?.ssoProvider.lastNameAttribute ?? "",
      name: application?.name ?? "",
      nameAttribute: application?.ssoProvider.nameAttribute ?? "",
      origin: application?.origin ?? "",
    },
    onSubmit: async ({ formApi, value }) => {
      const data = {
        certificate: value.certificate.trim(),
        domain: value.domain.trim(),
        emailAttribute: value.emailAttribute.trim(),
        entityId: value.entityId.trim(),
        entryPoint: value.entryPoint.trim(),
        firstNameAttribute: value.firstNameAttribute.trim(),
        lastNameAttribute: value.lastNameAttribute.trim(),
        name: value.name.trim(),
        nameAttribute: value.nameAttribute.trim(),
        origin: value.origin.trim(),
      };

      try {
        if (application) {
          await updateApplication.mutateAsync({ data: { ...data, id: application.id } });
        }
        else {
          await registerApplication.mutateAsync({ data });
        }
      }
      catch {
        return;
      }

      onOpenChange(false);
      formApi.reset();
    },
    validators: {
      onSubmit: application
        ? updateApplicationInputSchema.omit({ id: true })
        : registerApplicationInputSchema,
    },
  });

  const isPending = application ? updateApplication.isPending : registerApplication.isPending;

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
          <SheetTitle>{application ? "Edit Application" : "Register Application"}</SheetTitle>
        </SheetHeader>

        <form
          className="flex-1 overflow-y-auto"
          id="application"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="px-4">
            <FieldSet>
              <FieldLegend variant="label">Application</FieldLegend>

              <form.Field name="name">
                {field => <TextField field={field} label="Name" placeholder="Billing Portal" />}
              </form.Field>

              <form.Field name="origin">
                {field => (
                  <TextField field={field} label="Origin" placeholder="https://billing.acme.com" />
                )}
              </form.Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Identity provider</FieldLegend>

              <form.Field name="domain">
                {field => <TextField field={field} label="Email domain" placeholder="acme.com" />}
              </form.Field>

              <form.Field name="entryPoint">
                {field => (
                  <TextField
                    field={field}
                    label="Identity provider single sign-on URL"
                    placeholder="https://idp.acme.com/sso/saml"
                  />
                )}
              </form.Field>

              <form.Field name="entityId">
                {field => (
                  <TextField
                    field={field}
                    label="Identity provider issuer"
                    placeholder="https://idp.acme.com/entity-id"
                  />
                )}
              </form.Field>

              <form.Field name="certificate">
                {field => (
                  <TextField
                    as="textarea"
                    className="field-sizing-fixed font-mono text-xs"
                    field={field}
                    label="X.509 signing certificate"
                    placeholder="-----BEGIN CERTIFICATE-----"
                    rows={8}
                  />
                )}
              </form.Field>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <FieldLegend variant="label">Attribute mapping</FieldLegend>
              <FieldDescription>
                Optional. Leave blank unless your identity provider sends assertion
                attributes under different names. Email falls back to the NameID.
              </FieldDescription>

              <form.Field name="emailAttribute">
                {field => <TextField field={field} label="Email attribute" placeholder="email" />}
              </form.Field>

              <form.Field name="nameAttribute">
                {field => (
                  <TextField field={field} label="Display name attribute" placeholder="displayName" />
                )}
              </form.Field>

              <form.Field name="firstNameAttribute">
                {field => (
                  <TextField field={field} label="First name attribute" placeholder="givenName" />
                )}
              </form.Field>

              <form.Field name="lastNameAttribute">
                {field => (
                  <TextField field={field} label="Last name attribute" placeholder="surname" />
                )}
              </form.Field>
            </FieldSet>
          </FieldGroup>
        </form>

        <SheetFooter>
          <LoadingButton
            form="application"
            isPending={isPending}
            pendingLabel={application ? "Saving…" : "Registering…"}
            type="submit"
          >
            {application ? "Save changes" : "Register application"}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
