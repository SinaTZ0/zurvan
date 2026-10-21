import { zodResolver } from "@hookform/resolvers/zod";
import { SmartphoneIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "~/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "~/components/ui/input-group";
import { Spinner } from "~/components/ui/spinner";
import { authClient } from "~/lib/auth-client";
import { describeAuthError } from "~/routes/auth/auth-errors";
import { DemoAccounts } from "~/routes/auth/components/demo-accounts";
import { StepAlert } from "~/routes/auth/components/step-alert";
import { type PhoneInput, type PhoneValues, phoneSchema } from "~/routes/auth/schema";

/*===== Phone Step =====*/
/**
 * Step one: the phone number. Sends the code and hands the normalized number on, or, for someone who has set a password,
 * hands it to the password step without sending anything. There is no separate sign-up: a number seen for the first
 * time becomes a new customer account once its code is verified.
 */
export function PhoneStep({
  defaultPhoneNumber,
  showcase,
  focusOnMount,
  onSent,
  onChoosePassword,
}: {
  defaultPhoneNumber: string;
  /** Coming back from the code step: the field takes focus. Not on page load, where the reader starts at the top. */
  focusOnMount: boolean;
  /** Shows the demo accounts under the form, each filling in its number. */
  showcase: boolean;
  onSent: (phoneNumber: string) => void;
  /** The person would rather type their password: nothing is sent, the number goes on to the password step. */
  onChoosePassword: (phoneNumber: string) => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PhoneInput, unknown, PhoneValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phoneNumber: defaultPhoneNumber },
  });

  useEffect(() => {
    if (focusOnMount) setFocus("phoneNumber");
  }, [focusOnMount, setFocus]);

  const onSubmit = handleSubmit(async ({ phoneNumber }) => {
    const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber });
    if (error) {
      setError("root", { message: describeAuthError(error) });
      return;
    }
    onSent(phoneNumber);
  });

  // The same number check as the code button, then the password step instead of an SMS.
  const choosePassword = handleSubmit(({ phoneNumber }) => onChoosePassword(phoneNumber));

  return (
    <form method="post" onSubmit={onSubmit} noValidate>
      <FieldGroup>
        <StepAlert message={errors.root?.message} />

        <Field data-invalid={!!errors.phoneNumber}>
          <FieldLabel htmlFor="sign-in-phone">شماره موبایل</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <SmartphoneIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              id="sign-in-phone"
              type="tel"
              dir="ltr"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="0912 345 6789"
              aria-invalid={!!errors.phoneNumber}
              aria-describedby="sign-in-phone-note"
              className="text-start text-lg tracking-wide sm:text-xl"
              {...register("phoneNumber")}
            />
          </InputGroup>
          <FieldDescription id="sign-in-phone-note">کد ورود رو به همین شماره پیامک می‌کنیم.</FieldDescription>
          <FieldError errors={[errors.phoneNumber]} className="answer-in" />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          کد ورود رو بفرست
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
          onClick={choosePassword}
        >
          ورود با رمز عبور
        </Button>

        {showcase && (
          <DemoAccounts
            onPick={(phoneNumber) => {
              setValue("phoneNumber", phoneNumber, { shouldValidate: true });
              setFocus("phoneNumber");
            }}
          />
        )}
      </FieldGroup>
    </form>
  );
}
