import { useForm } from "@tanstack/react-form";
import { UserPlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.tsx";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.tsx";
import { LoadError } from "@/components/ui/load-error.tsx";
import { LoadingButton } from "@/components/ui/loading-button.tsx";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { TextField } from "@/components/ui/text-field.tsx";
import { useRoles } from "@/features/access/api/list-roles.ts";
import { addMemberInputSchema, useAddMember } from "@/features/members/api/add-member.ts";
import { RoleSwitchList } from "@/features/members/components/role-switch-list.tsx";

interface AddMemberSheetProps {
  organizationId: string;
}

export function AddMemberSheet({ organizationId }: AddMemberSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rolesQuery = useRoles({ organizationId });

  const addMember = useAddMember({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (added) => {
        toast.success(`${added.name} was added.`, {
          description: `Signing in as ${added.email} now grants ${added.roles.join(", ")}.`,
        });
      },
    },
    organizationId,
  });

  const form = useForm({
    defaultValues: {
      email: "",
      organizationId,
      roles: ["member"] as string[],
    },
    onSubmit: async ({ formApi, value }) => {
      try {
        await addMember.mutateAsync({
          data: {
            email: value.email,
            organizationId,
            roles: value.roles,
          },
        });
      }
      catch {
        return;
      }

      setIsOpen(false);
      formApi.reset();
    },
    validators: { onSubmit: addMemberInputSchema },
  });

  const assignable = useMemo(
    () => (rolesQuery.data ?? []).map(role => role.name).sort(),
    [rolesQuery.data],
  );

  function toggle(open: boolean) {
    setIsOpen(open);

    if (!open) {
      form.reset();
    }
  }

  return (
    <Sheet onOpenChange={toggle} open={isOpen}>
      <SheetTrigger asChild>
        <Button>
          <UserPlusIcon />
          Add Member
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Member</SheetTitle>
          <SheetDescription>
            Grant someone who already signs in through the gateway access to this application.
          </SheetDescription>
        </SheetHeader>

        <form
          className="flex-1 overflow-y-auto"
          id="add-member"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <FieldGroup className="px-4">
            <form.Field name="email">
              {field => (
                <TextField
                  description="They have to have signed in to the gateway at least once."
                  field={field}
                  label="Email"
                  placeholder="ada@acme.com"
                  type="email"
                />
              )}
            </form.Field>

            {rolesQuery.isPending && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {rolesQuery.isError && (
              <LoadError
                message={rolesQuery.error.message}
                onRetry={() => void rolesQuery.refetch()}
                title="Could not load roles"
              />
            )}

            {rolesQuery.isSuccess && (
              <form.Field name="roles">
                {(field) => {
                  const held = new Set(field.state.value);
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Roles</FieldLabel>
                      <RoleSwitchList
                        held={held}
                        onToggle={role => field.handleChange(held.has(role)
                          ? field.state.value.filter(name => name !== role)
                          : [...field.state.value, role].sort())}
                        roles={assignable}
                      />
                      <FieldDescription>
                        Only an owner can grant owner.
                      </FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
            )}
          </FieldGroup>
        </form>

        <SheetFooter>
          <LoadingButton
            form="add-member"
            isPending={addMember.isPending}
            pendingLabel="Adding…"
            type="submit"
          >
            Add member
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
