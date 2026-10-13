import type { UseFormReturn } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import type { NameFormValues } from "~/routes/account_profile/schema";

/*===== Name Form =====*/
/**
 * The name card: first and last name, saved on their own. The form's state lives in the page (`useNameForm`) so the tag
 * can follow what is typed; this is only the card. Focus anywhere inside tells the page, so the dog's bubble answers.
 */
export function NameForm({
  form,
  onSubmit,
  isPending,
  isDirty,
  onFocusCard,
}: {
  form: UseFormReturn<NameFormValues>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  isPending: boolean;
  isDirty: boolean;
  onFocusCard: () => void;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <section
      aria-labelledby="profile-name-title"
      className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"
    >
      <h2 id="profile-name-title" className="text-lg font-extrabold">
        اسمت
      </h2>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">مربی با همین اسم صدایت می‌کند.</p>

      <form method="post" onSubmit={onSubmit} noValidate className="mt-6">
        {/* The listener sits on this wrapper, not the form or section: focus events bubble up to it from the fields,
            and the a11y lint rejects a handler on a landmark. */}
        <div className="flex flex-col gap-6" onFocus={onFocusCard}>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field data-invalid={!!errors.firstName}>
              <FieldLabel htmlFor="profile-first-name">نام</FieldLabel>
              <Input
                id="profile-first-name"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                {...register("firstName")}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            <Field data-invalid={!!errors.lastName}>
              <FieldLabel htmlFor="profile-last-name">نام خانوادگی</FieldLabel>
              <Input
                id="profile-last-name"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                {...register("lastName")}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>
          </div>

          {/* Directly above the button, where the eye is after pressing it. */}
          <FormAlert message={errors.root?.message} />

          <Button type="submit" className="w-full sm:w-auto sm:min-w-36 sm:self-start" disabled={!isDirty || isPending}>
            {isPending && <Spinner data-icon="inline-start" />}
            {isPending ? "در حال ذخیره…" : "ذخیره"}
          </Button>
        </div>
      </form>
    </section>
  );
}
