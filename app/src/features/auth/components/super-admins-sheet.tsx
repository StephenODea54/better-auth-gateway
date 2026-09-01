import { useForm } from "@tanstack/react-form";
import { ShieldCheckIcon, UserMinusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { SuperAdmin } from "@/features/auth/api/list-super-admins.ts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Button } from "@/components/ui/button.tsx";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog.tsx";
import { FieldGroup } from "@/components/ui/field.tsx";
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
                <LoadError
                  message={superAdminsQuery.error.message}
                  onRetry={() => void superAdminsQuery.refetch()}
                  title="Could not load super admins"
                />
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
            <LoadingButton
              form="grant-super-admin"
              isPending={grantSuperAdmin.isPending}
              pendingLabel="Promoting…"
              type="submit"
            >
              Promote to super admin
            </LoadingButton>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmActionDialog
        confirmLabel="Revoke super admin"
        description="This drops their owner access in every application. They keep signing in, but only reach applications they were added to on their own."
        isPending={revokeSuperAdmin.isPending}
        onConfirm={() => {
          if (revoking) {
            revokeSuperAdmin.mutate({ data: { userId: revoking.id } });
          }
        }}
        onOpenChange={open => !open && setRevoking(null)}
        open={Boolean(revoking)}
        pendingLabel="Revoking…"
        title={`Revoke ${revoking?.name}?`}
      />
    </>
  );
}
