import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { PasswordInput } from "~/components/password-input";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { describeAuthError } from "~/routes/auth/auth-errors";
import type { VerifiedUser } from "~/routes/auth/components/code-step";
import { StepAlert } from "~/routes/auth/components/step-alert";
import { WithMark } from "~/routes/auth/components/with-mark";
import { type PasswordValues, passwordSchema } from "~/routes/auth/schema";
import { m } from "~/paraglide/messages";

/*===== Password Step =====*/
/**
 * The other way in: the number and the password the person set from their profile. The code stays one tap away, because
 * a forgotten password is fixed by signing in with a code and setting a new one (`onUseCode`, with `forgot` when the
 * person said so, which sends them to the password card afterwards).
 *
 * A wrong password, an unknown number and a number that never set one all read the same (see `describeAuthError`), so this
 * step can't be used to find out who has an account.
 */
export function PasswordStep({
  phoneNumber,
  onEditPhone,
  onUseCode,
  onSignedIn,
}: {
  phoneNumber: string;
  onEditPhone: () => void;
  /** The person asked for a code instead: it has been sent, and the flow moves to the code step. */
  onUseCode: (options: { forgot: boolean }) => void;
  onSignedIn: (user: VerifiedUser) => void | Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "" } });
  const [isSendingCode, setIsSendingCode] = useState(false);

  // This step is only ever reached from the phone step, so the field always takes focus.
  useEffect(() => setFocus("password"), [setFocus]);

  // The field is disabled while signing in, which drops focus. After a refusal it comes back for the next try.
  const hasRootError = !!errors.root;
  useEffect(() => {
    if (hasRootError && !isSubmitting) setFocus("password");
  }, [hasRootError, isSubmitting, setFocus]);

  const onSubmit = handleSubmit(async ({ password }) => {
    const { data, error } = await authClient.signIn.phoneNumber({ phoneNumber, password });
    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }
    await onSignedIn(data.user ?? {});
  });

  /*------ Code Instead ------*/
  async function sendCodeInstead({ forgot }: { forgot: boolean }) {
    setIsSendingCode(true);
    clearErrors();
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    setIsSendingCode(false);
    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }
    onUseCode({ forgot });
  }

  const isBusy = isSubmitting || isSendingCode;

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        {/*------ Whose Password ------*/}
        <p className="text-sm text-pretty text-muted-foreground">
          <WithMark text={(mark) => m.auth_password_using({ phone: mark })}>
            <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
              {phoneNumber}
            </bdi>
          </WithMark>{" "}
          <button
            type="button"
            onClick={onEditPhone}
            className="rounded-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            {m.auth_edit_phone()}
          </button>
        </p>

        <StepAlert message={errors.root?.message} />

        {/*------ Password ------*/}
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="sign-in-password">{m.auth_password_label()}</FieldLabel>
          <PasswordInput
            id="sign-in-password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            disabled={isSubmitting}
            {...register("password")}
          />
          <FieldError errors={[errors.password]} className="answer-in" />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isBusy}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {m.auth_sign_in()}
        </Button>

        {/*------ Other Ways ------*/}
        <div className="flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={isBusy}
            onClick={() => sendCodeInstead({ forgot: false })}
          >
            {isSendingCode && <Spinner data-icon="inline-start" />}
            {m.auth_password_via_code()}
          </Button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => sendCodeInstead({ forgot: true })}
            className="self-center rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {m.auth_password_forgot()}
          </button>
        </div>
      </FieldGroup>
    </form>
  );
}
