import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";

import { FormAlert } from "~/components/form-alert";
import { PasswordInput } from "~/components/password-input";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { useSignOut } from "~/hooks/use-sign-out";
import { toPersianDigits } from "~/lib/digits";
import { PASSWORD_MIN_LENGTH } from "~/lib/user-constants";
import { useSavePassword } from "~/routes/account_profile/hooks/use-save-password";
import { type PasswordFormValues, passwordFormSchema } from "~/routes/account_profile/schema";
import { applyPasswordServerError, SESSION_TOO_OLD_CODE } from "~/routes/account_profile/server-errors";

/** The card's own address: the sign-in page's «forgot my password» path ends here, and so does a fresh sign-in. */
const PASSWORD_CARD_ID = "password";
const PASSWORD_CARD_HASH = `#${PASSWORD_CARD_ID}`;

/*===== Password Form =====*/
/**
 * The password card: set a password, or replace the one already set. There is no «current password» field on purpose:
 * someone who forgot theirs signs in with a code and lands here, so asking for the old one would lock them out of the
 * only way to fix it. The protection is the server's: a password can be set or replaced only within half an hour of
 * signing in, and doing so signs every other device out.
 *
 * When the session is already older than that, the card says so and offers to sign out and come straight back (the
 * sign-in page returns to this card).
 */
export function PasswordForm({
  hasPassword,
  onFocusCard,
  onSaved,
}: {
  /** Whether the person has a password already; only changes the wording. */
  hasPassword: boolean;
  onFocusCard: () => void;
  onSaved: () => void;
}) {
  const [isSet, setIsSet] = useState(hasPassword);
  const [isSessionTooOld, setIsSessionTooOld] = useState(false);
  const savePassword = useSavePassword();
  const signOut = useSignOut({ redirectTo: `/account/profile${PASSWORD_CARD_HASH}` });
  const { hash } = useLocation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    clearErrors,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Arriving from «forgot my password»: the person came here to type the new one, so the field is ready.
  const arrivedForNewPassword = hash === PASSWORD_CARD_HASH;
  useEffect(() => {
    if (arrivedForNewPassword) setFocus("newPassword");
  }, [arrivedForNewPassword, setFocus]);

  const onSubmit = handleSubmit((submitted) => {
    setIsSessionTooOld(false);
    savePassword.mutate(
      { newPassword: submitted.newPassword },
      {
        onSuccess: () => {
          setIsSet(true);
          reset();
          toast.add({ title: "رمز عبورت ذخیره شد.", type: "success" });
          onSaved();
        },
        onError: (error) => {
          setIsSessionTooOld("code" in error && error.code === SESSION_TOO_OLD_CODE);
          applyPasswordServerError({ error, setError });
        },
      },
    );
  });

  return (
    <section
      id={PASSWORD_CARD_ID}
      aria-labelledby="profile-password-title"
      className="scroll-mt-24 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8"
    >
      <h2 id="profile-password-title" className="text-lg font-extrabold">
        رمز عبور
      </h2>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">
        {isSet
          ? "با شماره و رمز عبور هم می‌توانی وارد شوی. رمزت یادت رفت؟ با کد پیامکی وارد شو و همین‌جا رمز تازه بگذار."
          : "رمز بگذار تا بدون منتظر ماندن برای پیامک وارد شوی. ورود با کد پیامکی هم همیشه می‌ماند."}
      </p>

      <form method="post" onSubmit={onSubmit} noValidate className="mt-6">
        <div className="flex flex-col gap-6" onFocus={onFocusCard}>
          <Field data-invalid={!!errors.newPassword}>
            <FieldLabel htmlFor="profile-new-password">{isSet ? "رمز عبور تازه" : "رمز عبور"}</FieldLabel>
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              aria-invalid={!!errors.newPassword}
              {...register("newPassword", { onChange: () => clearErrors("root") })}
            />
            <FieldDescription>
              حداقل {toPersianDigits(String(PASSWORD_MIN_LENGTH))} نویسه. شماره‌ی موبایلت یا رمزهای خیلی ساده قبول
              نمی‌شود.
            </FieldDescription>
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field data-invalid={!!errors.confirmPassword}>
            <FieldLabel htmlFor="profile-confirm-password">تکرار رمز عبور</FieldLabel>
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          {/* Directly above the button, where the eye is after pressing it. */}
          <FormAlert message={errors.root?.message} />

          {isSessionTooOld && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto sm:self-start"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              {signOut.isPending && <Spinner data-icon="inline-start" />}
              خروج و ورود دوباره
            </Button>
          )}

          <Button
            type="submit"
            className="w-full sm:w-auto sm:min-w-36 sm:self-start"
            disabled={savePassword.isPending}
          >
            {savePassword.isPending && <Spinner data-icon="inline-start" />}
            {savePassword.isPending ? "در حال ذخیره…" : isSet ? "تغییر رمز" : "ذخیره‌ی رمز"}
          </Button>
        </div>
      </form>
    </section>
  );
}
