import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "cn";
import { KeyRoundIcon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router";

import { PasswordInput } from "~/components/password-input";
import { Button } from "~/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Spinner } from "~/components/ui/spinner";
import { toast } from "~/components/ui/toast";
import { useSignOut } from "~/hooks/use-sign-out";
import { toPersianDigits } from "~/lib/digits";
import { PASSWORD_MIN_LENGTH } from "~/lib/user-constants";
import type { CardVoiceProps } from "~/routes/account_profile/card-voice-props";
import { CardBubble } from "~/routes/account_profile/components/card-bubble";
import { CardHead } from "~/routes/account_profile/components/card-head";
import { EdgeDog } from "~/routes/account_profile/components/edge-dog";
import { RisingAlert } from "~/routes/account_profile/components/rising-alert";
import { SaveButton } from "~/routes/account_profile/components/save-button";
import { useFlash } from "~/routes/account_profile/hooks/use-flash";
import { useSavePassword } from "~/routes/account_profile/hooks/use-save-password";
import { PLATE } from "~/routes/account_profile/plate";
import { type PasswordFormValues, passwordFormSchema } from "~/routes/account_profile/schema";
import { applyPasswordServerError, SESSION_TOO_OLD_CODE } from "~/routes/account_profile/server-errors";

/** The card's own address: the sign-in page's «forgot my password» path ends here, and so does a fresh sign-in. */
const PASSWORD_CARD_ID = "password";
const PASSWORD_CARD_HASH = `#${PASSWORD_CARD_ID}`;

/*===== Password Card =====*/
/**
 * «رمز عبور»: set a password, or replace the one already set. There is no «current password» field on purpose:
 * someone who forgot theirs signs in with a code and lands here, so asking for the old one would lock them out of the
 * only way to fix it. The protection is the server's: a password can be set or replaced only within half an hour of
 * signing in, and doing so signs every other device out.
 *
 * Three wordings: no password yet, one already set, and a session too old to change it, where the card says so (the
 * alert) and offers to sign out and come straight back (the sign-in page returns to this card).
 *
 * The `key-carry` dog stands on the plate's top edge with a key in his mouth, the dimmed front door behind him.
 */
export function PasswordCard({
  hasPassword,
  voice,
  onEnter,
  onSaved,
  onFailed,
}: {
  /** Whether the person has a password already; only changes the wording. */
  hasPassword: boolean;
  voice: CardVoiceProps;
  onEnter: () => void;
  onSaved: () => void;
  onFailed: () => void;
}) {
  const [isSet, setIsSet] = useState(hasPassword);
  const [isSessionTooOld, setIsSessionTooOld] = useState(false);
  const saved = useFlash();
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

  /*------ Submit ------*/
  const onSubmit = handleSubmit((submitted) => {
    setIsSessionTooOld(false);
    savePassword.mutate(
      { newPassword: submitted.newPassword },
      {
        onSuccess: () => {
          setIsSet(true);
          reset();
          toast.add({ title: "رمز عبورت ذخیره شد.", type: "success" });
          saved.flash();
          onSaved();
        },
        onError: (error) => {
          setIsSessionTooOld("code" in error && error.code === SESSION_TOO_OLD_CODE);
          applyPasswordServerError({ error, setError });
          onFailed();
        },
      },
    );
  }, onFailed);

  return (
    <section id={PASSWORD_CARD_ID} aria-labelledby="profile-password-title" className="scroll-mt-24">
      <CardHead
        id="profile-password-title"
        title="رمز عبور"
        figureClassName="me-[5.5rem] sm:me-[6.75rem]"
        figure={
          <EdgeDog
            name="key-carry"
            idle="lively-tilt"
            className="w-[5.25rem] sm:w-[6.5rem]"
            scenery={{ name: "door", className: "right-[70%] w-[118%] translate-y-[2%]" }}
          >
            <CardBubble {...voice} className="bottom-[66%] left-[98%]" />
          </EdgeDog>
        }
      />

      <div className={PLATE}>
        {/* Rises in only when a first password changes the wording, not on load. */}
        <p
          key={isSet ? "set" : "none"}
          className={cn("text-pretty text-muted-foreground", isSet !== hasPassword && "answer-in")}
        >
          {isSet
            ? "با شماره و رمز عبور هم می‌تونی وارد شی. رمزت یادت رفت؟ با کد پیامکی وارد شو و همین‌جا رمز تازه بذار."
            : "رمز بذار تا بدون منتظر موندن برای پیامک وارد شی. ورود با کد پیامکی هم همیشه سر جاشه."}
        </p>

        <form method="post" onSubmit={onSubmit} noValidate className="mt-6">
          <div className="flex flex-col gap-6" onFocus={onEnter}>
            <Field data-invalid={!!errors.newPassword}>
              <FieldLabel htmlFor="profile-new-password">{isSet ? "رمز عبور تازه" : "رمز عبور"}</FieldLabel>
              <PasswordInput
                id="profile-new-password"
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                {...register("newPassword", { onChange: () => clearErrors("root") })}
              />
              <FieldDescription>
                دست‌کم {toPersianDigits(String(PASSWORD_MIN_LENGTH))} نویسه. شماره‌ی موبایلت یا رمزهای خیلی ساده قبول
                نمی‌شه.
              </FieldDescription>
              <FieldError key={errors.newPassword?.message} errors={[errors.newPassword]} className="answer-in" />
            </Field>

            <Field data-invalid={!!errors.confirmPassword}>
              <FieldLabel htmlFor="profile-confirm-password">تکرار رمز عبور</FieldLabel>
              <PasswordInput
                id="profile-confirm-password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              <FieldError
                key={errors.confirmPassword?.message}
                errors={[errors.confirmPassword]}
                className="answer-in"
              />
            </Field>

            <RisingAlert message={errors.root?.message} />

            {/*------ Session Too Old ------*/}
            {/* The way out the alert above describes: sign out, come back with a code, land on this card. */}
            {isSessionTooOld && (
              <Button
                type="button"
                variant="outline"
                className="answer-in h-12 w-full sm:w-auto sm:self-start"
                disabled={signOut.isPending}
                onClick={() => signOut.mutate()}
              >
                {signOut.isPending ? <Spinner data-icon="inline-start" /> : <LogOutIcon aria-hidden />}
                خروج و ورود دوباره
              </Button>
            )}

            <SaveButton
              label={isSet ? "تغییر رمز" : "ذخیره‌ی رمز"}
              icon={<KeyRoundIcon />}
              isPending={savePassword.isPending}
              isSaved={saved.on}
              disabled={false}
            />
          </div>
        </form>
      </div>
    </section>
  );
}
