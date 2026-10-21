import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { toLatinDigits, toPersianDigits } from "~/lib/digits";
import { SHOWCASE_SIGN_IN_CODE, SIGN_IN_CODE_LENGTH, SIGN_IN_CODE_RESEND_SECONDS } from "~/lib/user-constants";
import { describeAuthError } from "~/routes/auth/auth-errors";
import { StepAlert } from "~/routes/auth/components/step-alert";
import { type CodeValues, codeSchema } from "~/routes/auth/schema";

/** Persian keyboards type Persian or Arabic-Indic digits; the field takes them and stores ASCII. */
const DIGIT_PATTERN = "^[0-9۰-۹٠-٩]+$";

/** What the flow needs from a verified sign-in to decide the next step. */
export type VerifiedUser = { firstName?: string | null };

/*===== Code Step =====*/
/**
 * Step two: the five-digit code from the SMS. It submits itself once the last digit is in, offers a new code after
 * the resend wait (spec 2: 60 seconds), and lets the person go back to fix the number.
 */
export function CodeStep({
  phoneNumber,
  sentAt,
  showcase,
  onResent,
  onEditPhone,
  onVerified,
}: {
  phoneNumber: string;
  /** When the current code went out, in epoch milliseconds. */
  sentAt: number;
  showcase: boolean;
  onResent: (sentAt: number) => void;
  onEditPhone: () => void;
  onVerified: (user: VerifiedUser) => void | Promise<void>;
}) {
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });
  const secondsLeft = useSecondsLeft(sentAt + SIGN_IN_CODE_RESEND_SECONDS * 1000);
  const [isResending, setIsResending] = useState(false);

  // The code step is only ever reached from the phone step, so the field always takes focus.
  useEffect(() => setFocus("code"), [setFocus]);

  // The field is disabled while verifying, which drops focus. After a failed try it comes back, so the next digits go straight in.
  const hasRootError = !!errors.root;
  useEffect(() => {
    if (hasRootError && !isSubmitting) setFocus("code");
  }, [hasRootError, isSubmitting, setFocus]);

  const onSubmit = handleSubmit(async ({ code }) => {
    const { data, error } = await authClient.phoneNumber.verify({ phoneNumber, code });
    if (error) {
      setError("root", { message: describeAuthError(error) });
      resetField("code");
      return;
    }
    await onVerified(data.user ?? {});
  });

  /*------ Resend ------*/
  async function resend() {
    setIsResending(true);
    clearErrors();
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    setIsResending(false);
    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }
    resetField("code");
    onResent(Date.now());
  }

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        {/*------ Where It Went ------*/}
        <p className="text-sm text-pretty text-muted-foreground">
          کد {toPersianDigits(String(SIGN_IN_CODE_LENGTH))} رقمی رو به{" "}
          <bdi dir="ltr" className="font-bold text-foreground tabular-nums">
            {phoneNumber}
          </bdi>{" "}
          پیامک کردیم.{" "}
          <button
            type="button"
            onClick={onEditPhone}
            className="rounded-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            ویرایش شماره
          </button>
        </p>

        <StepAlert message={errors.root?.message} />

        {/*------ Code ------*/}
        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="sign-in-code">کد ورود</FieldLabel>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              // The digits read left to right, like the SMS shows them.
              <div dir="ltr" className="flex justify-center">
                <InputOTP
                  id="sign-in-code"
                  maxLength={SIGN_IN_CODE_LENGTH}
                  pattern={DIGIT_PATTERN}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  ref={field.ref}
                  value={field.value}
                  onChange={(value) => field.onChange(toLatinDigits(value))}
                  onComplete={() => void onSubmit()}
                  aria-invalid={!!errors.code}
                  disabled={isSubmitting}
                >
                  <InputOTPGroup className="gap-2">
                    {/* Five wells on the plate: the input fill and its hairline, a gold ring on the one being typed in. */}
                    {Array.from({ length: SIGN_IN_CODE_LENGTH }, (_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        aria-invalid={!!errors.code}
                        className="size-13 rounded-xl border border-input text-xl font-bold first:rounded-xl last:rounded-xl"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            )}
          />
          <FieldError errors={[errors.code]} className="answer-in" />
        </Field>

        {/* Showcase mode sends no SMS, so the page says the code out loud. */}
        {showcase && (
          <p className="rounded-2xl border border-dashed border-primary/35 bg-sunken paper-grain px-3 py-2.5 text-center text-sm text-muted-foreground">
            نسخه‌ی نمایشی: کد ورود همیشه{" "}
            <span className="font-bold text-primary">{toPersianDigits(SHOWCASE_SIGN_IN_CODE)}</span> هست.
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          ورود
        </Button>

        {/*------ Resend ------*/}
        <p className="text-center text-sm text-muted-foreground">
          کدی نرسید؟{" "}
          {secondsLeft > 0 ? (
            <span className="tabular-nums">ارسال دوباره تا {formatCountdown(secondsLeft)}</span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              disabled={isResending}
              className="rounded-sm font-bold text-primary underline-offset-4 hover:underline disabled:opacity-50"
            >
              کد رو دوباره بفرست
            </button>
          )}
        </p>
      </FieldGroup>
    </form>
  );
}

/*===== Countdown =====*/
/** Whole seconds until `until`, ticking once a second and stopping at 0. */
function useSecondsLeft(until: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= until) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [until]);
  return Math.max(0, Math.ceil((until - now) / 1000));
}

/** `45` → "۰:۴۵". */
function formatCountdown(seconds: number) {
  return toPersianDigits(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`);
}
