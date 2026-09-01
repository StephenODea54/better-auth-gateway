import { useForm } from "@tanstack/react-form";
import { Loader2Icon, RefreshCwIcon, TriangleAlertIcon, UserPlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button.tsx";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty.tsx";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useRoles } from "@/features/access/api/list-roles.ts";
import { addMemberInputSchema, useAddMember } from "@/features/members/api/add-member.ts";

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
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      placeholder="ada@acme.com"
                      type="email"
                      value={field.state.value}
                    />
                    <FieldDescription>
                      They have to have signed in to the gateway at least once.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            {rolesQuery.isPending && (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            )}

            {rolesQuery.isError && (
              <Empty className="rounded-xl border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TriangleAlertIcon />
                  </EmptyMedia>
                  <EmptyTitle>Could not load roles</EmptyTitle>
                  <EmptyDescription>{rolesQuery.error.message}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={() => void rolesQuery.refetch()} variant="outline">
                    <RefreshCwIcon />
                    Try again
                  </Button>
                </EmptyContent>
              </Empty>
            )}

            {rolesQuery.isSuccess && (
              <form.Field name="roles">
                {(field) => {
                  const held = new Set(field.state.value);
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Roles</FieldLabel>
                      <div className="overflow-hidden rounded-xl border">
                        {assignable.map(role => (
                          <div
                            className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
                            key={role}
                          >
                            <span className="truncate text-sm font-medium">{role}</span>
                            <Switch
                              aria-label={role}
                              checked={held.has(role)}
                              onCheckedChange={() => field.handleChange(held.has(role)
                                ? field.state.value.filter(name => name !== role)
                                : [...field.state.value, role].sort())}
                            />
                          </div>
                        ))}
                      </div>
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
          <Button disabled={addMember.isPending} form="add-member" type="submit">
            {addMember.isPending
              ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Adding…
                  </>
                )
              : "Add member"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
