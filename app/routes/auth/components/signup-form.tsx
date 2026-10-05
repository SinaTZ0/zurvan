import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { LockKeyholeIcon, MailIcon, UserRoundIcon } from "lucide-react";
import { useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { ALTCHA_HEADER } from "~/lib/auth-constants";
import { describeAuthError } from "~/routes/auth/auth-errors";
import { AltchaWidget, type AltchaWidgetHandle } from "~/routes/auth/components/altcha-widget";
import { type SignupValues, signupSchema } from "~/routes/auth/schema";

/*===== Sign-up Form =====*/
/**
 * Creates an account (no email verification) and signs the user in. Requires a solved Altcha
 * challenge, which the server checks before Better-Auth creates the user.
 */
export function SignupForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const captchaRef = useRef<AltchaWidgetHandle>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", altcha: "" },
  });

  const handleCaptchaPayload = useCallback(
    (payload: string | null) => {
      // Validate only once solved, so the "complete the check" message clears without nagging earlier.
      setValue("altcha", payload ?? "", { shouldValidate: payload !== null });
    },
    [setValue],
  );

  const submitSignup = async ({ altcha, ...values }: SignupValues) => {
    const { error } = await authClient.signUp.email(values, {
      headers: { [ALTCHA_HEADER]: altcha },
    });

    if (error) {
      const { field, message } = describeAuthError(error);
      setError(field, { message });
      // The server consumes a verified payload on every attempt, so the next try needs a new one.
      captchaRef.current?.reset();
      return;
    }

    queryClient.clear();
    await navigate("/pets", { viewTransition: true });
  };

  return (
    // `method="post"`: a submit before hydration must never put the password in the URL.
    <form method="post" onSubmit={(event) => void handleSubmit(submitSignup)(event)} noValidate>
      <FieldGroup>
        <FormAlert message={errors.root?.message} />

        {/*------ Name ------*/}
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="signup-name">نام</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <UserRoundIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="signup-name"
              autoComplete="name"
              placeholder="مثلاً سارا"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
          </InputGroup>
          <FieldError errors={[errors.name]} />
        </Field>

        {/*------ Email ------*/}
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="signup-email">ایمیل</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MailIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="signup-email"
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
          <FieldLabel htmlFor="signup-password">رمز عبور</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <LockKeyholeIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="signup-password"
              type="password"
              dir="ltr"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby="signup-password-hint"
              {...register("password")}
            />
          </InputGroup>
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription id="signup-password-hint">حداقل ۸ کاراکتر</FieldDescription>
          )}
        </Field>

        {/*------ Captcha ------*/}
        <Field data-invalid={!!errors.altcha}>
          <AltchaWidget ref={captchaRef} onPayloadChange={handleCaptchaPayload} invalid={!!errors.altcha} />
          <FieldError errors={[errors.altcha]} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          ساخت حساب
        </Button>
      </FieldGroup>
    </form>
  );
}
