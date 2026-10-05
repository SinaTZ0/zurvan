import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyholeIcon, MailIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { describeAuthError } from "~/routes/auth/auth-errors";
import { type LoginValues, loginSchema } from "~/routes/auth/schema";

/*===== Login Form =====*/
/** Email + password sign-in. On success, goes to the pets page. */
export function LoginForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const { error } = await authClient.signIn.email(values);

    if (error) {
      const { field, message } = describeAuthError(error);
      setError(field === "altcha" ? "root" : field, { message });
      return;
    }

    // Drop anything cached for a previous account before showing this user's data.
    queryClient.clear();
    await navigate("/pets", { viewTransition: true });
  });

  return (
    // `method="post"`: a submit before hydration must never put the password in the URL.
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <FormAlert message={errors.root?.message} />

        {/*------ Email ------*/}
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="login-email">ایمیل</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="login-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              placeholder="sara@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </InputGroup>
          <FieldError errors={[errors.email]} />
        </Field>

        {/*------ Password ------*/}
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="login-password">رمز عبور</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockKeyholeIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="login-password"
              type="password"
              dir="ltr"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              {...register("password")}
            />
          </InputGroup>
          <FieldError errors={[errors.password]} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          ورود
        </Button>
      </FieldGroup>
    </form>
  );
}
