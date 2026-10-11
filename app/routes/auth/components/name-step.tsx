import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { describeAuthError } from "~/routes/auth/auth-errors";
import { type NameValues, nameSchema } from "~/routes/auth/schema";

/*===== Name Step =====*/
/**
 * Step three, for a new number only: the account already exists and is signed in, so this just names it. Asked here
 * rather than up front, since a returning customer should never see it.
 */
export function NameStep({
  focusOnMount,
  onDone,
}: {
  /** Arriving from the code step: the first field takes focus. Not when the page itself opens on this step. */
  focusOnMount: boolean;
  onDone: () => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<NameValues>({ resolver: zodResolver(nameSchema), defaultValues: { firstName: "", lastName: "" } });

  useEffect(() => {
    if (focusOnMount) setFocus("firstName");
  }, [focusOnMount, setFocus]);

  const onSubmit = handleSubmit(async ({ firstName, lastName }) => {
    // Better-Auth's own `name` is shown wherever a full name is needed, so it follows the two parts.
    const { error } = await authClient.updateUser({ firstName, lastName, name: `${firstName} ${lastName}` });
    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }
    await onDone();
  });

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <p className="text-sm text-pretty text-muted-foreground">
          حسابت ساخته شد. اسمت را بنویس تا مربی بداند با چه کسی کار می‌کند.
        </p>

        <FormAlert message={errors.root?.message} />

        <Field data-invalid={!!errors.firstName}>
          <FieldLabel htmlFor="sign-in-first-name">نام</FieldLabel>
          <Input
            id="sign-in-first-name"
            autoComplete="given-name"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          <FieldError errors={[errors.firstName]} />
        </Field>

        <Field data-invalid={!!errors.lastName}>
          <FieldLabel htmlFor="sign-in-last-name">نام خانوادگی</FieldLabel>
          <Input
            id="sign-in-last-name"
            autoComplete="family-name"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          <FieldError errors={[errors.lastName]} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          ادامه
        </Button>
      </FieldGroup>
    </form>
  );
}
