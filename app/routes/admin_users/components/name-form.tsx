import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { client } from "~/orpc/client";
import type { AdminUser } from "~/orpc/user/contract";
import { NAME_FIELDS, type UserNameInput, type UserNameValues, userNameSchema } from "~/routes/admin_users/schema";

/*===== Name Form =====*/
/**
 * «نام» and «نام خانوادگی»: the only thing the Admin can change about a person (he fixes misspelt names). The form owns
 * its request, so a failure shows right under the fields it came from; a save toasts, refreshes the list, and the
 * dialog stays open (the row flashes once when he closes it). The server's per-field messages go beside the fields
 * (`data.fields`). Its «ذخیره‌ی اسم» is the dialog's one gold button, lit only once the name has been changed.
 */
export function NameForm({ user, onGone }: { user: AdminUser; onGone: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<UserNameInput, unknown, UserNameValues>({
    resolver: zodResolver(userNameSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName },
  });

  /*------ Save ------*/
  const save = useAdminAction({
    mutationFn: (input: { id: string; firstName: string; lastName: string }) => client.user.admin.update(input),
    success: "اسم ذخیره شد",
    // The form shows the failure itself (fields and alert), so a toast would say it twice.
    toastFailure: false,
    // The saved names (trimmed by the server) become the form's new starting point.
    onSuccess: (saved) => reset({ firstName: saved.firstName, lastName: saved.lastName }),
    // The person is gone (NOT_FOUND): the hook has toasted why and reloaded.
    onConflict: onGone,
  });

  /*------ Server Messages ------*/
  const orphanMessages: string[] = [];
  useEffect(() => {
    if (!save.failure) return;
    for (const [field, message] of Object.entries(save.failure.fields)) {
      const target = NAME_FIELDS.find((name) => name === field);
      if (target) setError(target, { message });
    }
  }, [save.failure, setError]);
  // A field the form doesn't have (it shouldn't happen) is added to the alert instead of being lost.
  for (const [field, message] of Object.entries(save.failure?.fields ?? {})) {
    if (!NAME_FIELDS.some((name) => name === field)) orphanMessages.push(message);
  }
  const alert = [save.failure?.message, ...orphanMessages].filter(Boolean).join(" ");

  return (
    <form
      noValidate
      aria-labelledby="admin-user-name-title"
      onSubmit={handleSubmit((values) => {
        // A new attempt starts clean: the last failure's alert must not sit beside a request in flight.
        save.reset();
        save.run({ id: user.id, ...values });
      })}
      className="grid gap-4"
    >
      <h3 id="admin-user-name-title" className="text-sm font-bold">
        اسم
      </h3>

      {/*------ Fields ------*/}
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
        <Field data-invalid={!!errors.firstName} className="gap-2">
          <FieldLabel htmlFor="admin-user-first-name" className="text-xs text-muted-foreground">
            نام
          </FieldLabel>
          <Input
            id="admin-user-first-name"
            autoComplete="off"
            className="h-11 sm:h-10"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          <FieldError errors={[errors.firstName]} />
        </Field>

        <Field data-invalid={!!errors.lastName} className="gap-2">
          <FieldLabel htmlFor="admin-user-last-name" className="text-xs text-muted-foreground">
            نام خانوادگی
          </FieldLabel>
          <Input
            id="admin-user-last-name"
            autoComplete="off"
            className="h-11 sm:h-10"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          <FieldError errors={[errors.lastName]} />
        </Field>
      </div>

      <FormAlert message={save.isPending ? undefined : alert || undefined} />

      <Button type="submit" variant={isDirty ? "solid" : "outline"} className="h-11 w-full sm:h-10 sm:w-fit" disabled={save.isPending}>
        {save.isPending && <Spinner aria-hidden />}
        ذخیره‌ی اسم
      </Button>
    </form>
  );
}
