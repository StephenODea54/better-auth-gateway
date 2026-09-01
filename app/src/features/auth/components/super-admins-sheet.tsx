import { useForm } from "@tanstack/react-form";
import {
  Loader2Icon,
  RefreshCwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserMinusIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { SuperAdmin } from "@/features/auth/api/list-super-admins.ts";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
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
import { grantSuperAdminInputSchema, useGrantSuperAdmin } from "@/features/auth/api/grant-super-admin.ts";
import { useSuperAdmins } from "@/features/auth/api/list-super-admins.ts";
import { useRevokeSuperAdmin } from "@/features/auth/api/revoke-super-admin.ts";

interface SuperAdminsSheetProps {
  currentUserId: string;
}

export function SuperAdminsSheet({ currentUserId }: SuperAdminsSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [revoking, setRevoking] = useState<null | SuperAdmin>(null);

  const superAdminsQuery = useSuperAdmins({ queryConfig: { enabled: isOpen } });

  const grantSuperAdmin = useGrantSuperAdmin({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (granted) => {
        toast.success(`${granted.name} is now a gateway super admin.`, {
          description: `Signing in as ${granted.email} now reaches every application.`,
        });
      },
    },
  });

  const revokeSuperAdmin = useRevokeSuperAdmin({
    mutationConfig: {
      onError: (error) => {
        console.error(error);
        toast.error(error.message);
      },
      onSuccess: (revoked) => {
        toast.success(`${revoked.name} is no longer a gateway super admin.`);
        setRevoking(null);
      },
    },
  });

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ formApi, value }) => {
      try {
        await grantSuperAdmin.mutateAsync({ data: { email: value.email } });
      }
      catch {
        return;
      }

      formApi.reset();
    },
    validators: { onSubmit: grantSuperAdminInputSchema },
  });

  function toggle(open: boolean) {
    setIsOpen(open);

    if (!open) {
      form.reset();
    }
  }

  return (
    <>
      <Sheet onOpenChange={toggle} open={isOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <ShieldCheckIcon />
            Super admins
          </Button>
        </SheetTrigger>

        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Super admins</SheetTitle>
            <SheetDescription>
              Super admins register applications and hold owner access in every one of them,
              now and for every application registered later.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto">
            <form
              id="grant-super-admin"
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
              </FieldGroup>
            </form>

            <div className="space-y-2 px-4">
              <span className="text-sm font-medium">Current super admins</span>

              {superAdminsQuery.isPending && (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              )}

              {superAdminsQuery.isError && (
                <Empty className="rounded-xl border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <TriangleAlertIcon />
                    </EmptyMedia>
                    <EmptyTitle>Could not load super admins</EmptyTitle>
                    <EmptyDescription>{superAdminsQuery.error.message}</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button onClick={() => void superAdminsQuery.refetch()} variant="outline">
                      <RefreshCwIcon />
                      Try again
                    </Button>
                  </EmptyContent>
                </Empty>
              )}

              {superAdminsQuery.isSuccess && (
                <div className="overflow-hidden rounded-xl border">
                  {superAdminsQuery.data.map(superAdmin => (
                    <div
                      className="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
                      key={superAdmin.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar>
                          <AvatarImage alt={superAdmin.name} src={superAdmin.image ?? undefined} />
                          <AvatarFallback>
                            {superAdmin.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid min-w-0 leading-tight">
                          <span className="truncate text-sm font-medium">{superAdmin.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {superAdmin.email}
                          </span>
                        </div>
                      </div>

                      {superAdmin.id === currentUserId
                        ? <span className="text-xs text-muted-foreground">You</span>
                        : (
                            <Button
                              onClick={() => setRevoking(superAdmin)}
                              size="icon"
                              variant="ghost"
                            >
                              <UserMinusIcon />
                              <span className="sr-only">
                                {`Revoke super admin from ${superAdmin.name}`}
                              </span>
                            </Button>
                          )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button disabled={grantSuperAdmin.isPending} form="grant-super-admin" type="submit">
              {grantSuperAdmin.isPending
                ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Promoting…
                    </>
                  )
                : "Promote to super admin"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog onOpenChange={open => !open && setRevoking(null)} open={Boolean(revoking)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Revoke
              {" "}
              {revoking?.name}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This drops their owner access in every application. They keep signing in, but
              only reach applications they were added to on their own.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeSuperAdmin.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={revokeSuperAdmin.isPending}
              onClick={(event) => {
                event.preventDefault();

                if (revoking) {
                  revokeSuperAdmin.mutate({ data: { userId: revoking.id } });
                }
              }}
              variant="destructive"
            >
              {revokeSuperAdmin.isPending
                ? (
                    <>
                      <Loader2Icon className="animate-spin" />
                      Revoking…
                    </>
                  )
                : "Revoke super admin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
