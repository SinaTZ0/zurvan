import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import type { AuthStepName } from "~/routes/auth/auth-scenes";
import { CodeStep } from "~/routes/auth/components/code-step";
import { NameStep } from "~/routes/auth/components/name-step";
import { PasswordStep } from "~/routes/auth/components/password-step";
import { PhoneStep } from "~/routes/auth/components/phone-step";

/** Where someone who forgot their password lands after signing in with a code: the card where a new one is set. */
const NEW_PASSWORD_PATH = "/account/profile#password";

type Step =
  | { name: "phone" }
  | { name: "password"; phoneNumber: string }
  // `forgot`: the code was asked for because the password was forgotten, so signing in ends at the password card.
  | { name: "code"; phoneNumber: string; sentAt: number; forgot: boolean }
  | { name: "name" };

// The dog asks, so the questions are in its voice; the instructions under each stay plain.
const STEP_TITLES: Record<AuthStepName, string> = {
  phone: "شماره‌ی موبایلت چنده؟",
  password: "رمز عبورت چیه؟",
  code: "کد پیامک رو بگو",
  name: "اسمت چیه؟",
};

/*===== Sign-in Flow =====*/
/**
 * Phone → code → (first time only) name, or phone → password. Signing in and signing up are the same two steps (spec 2):
 * a number seen for the first time becomes a customer account when its code is verified, and only then is the name asked.
 * A password can only be set after that, from the profile page, so the password step is for people who already have an
 * account; one who forgot theirs takes the code step and is sent on to set a new one.
 */
export function SignInFlow({
  showcase,
  redirectTo,
  needsName,
  onStepChange,
}: {
  showcase: boolean;
  redirectTo: string;
  /** Signed in already but never named (e.g. the tab closed after the code), so start at the name. */
  needsName: boolean;
  /** The page's photo and bubble follow the step, so every move to a new step is reported. */
  onStepChange: (step: AuthStepName) => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(needsName ? { name: "name" } : { name: "phone" });
  // Kept when going back from the code or password step, so fixing one digit doesn't mean typing it all again.
  const [lastPhoneNumber, setLastPhoneNumber] = useState("");
  // Focus follows the person from step to step, but the page doesn't grab it on load.
  const [hasMoved, setHasMoved] = useState(false);
  const goTo = (next: Step) => {
    setHasMoved(true);
    setStep(next);
    onStepChange(next.name);
  };

  async function finish(to = redirectTo) {
    // Drop anything cached for a previous account before showing this one's data.
    queryClient.clear();
    await navigate(to, { viewTransition: true });
  }

  return (
    <section aria-labelledby="sign-in-step-title" className="flex flex-col gap-5">
      <h2 id="sign-in-step-title" className="text-h3 font-bold">
        {STEP_TITLES[step.name]}
      </h2>

      {step.name === "phone" && (
        <PhoneStep
          defaultPhoneNumber={lastPhoneNumber}
          showcase={showcase}
          focusOnMount={hasMoved}
          onSent={(phoneNumber) => {
            setLastPhoneNumber(phoneNumber);
            goTo({ name: "code", phoneNumber, sentAt: Date.now(), forgot: false });
          }}
          onChoosePassword={(phoneNumber) => {
            setLastPhoneNumber(phoneNumber);
            goTo({ name: "password", phoneNumber });
          }}
        />
      )}

      {step.name === "password" && (
        <PasswordStep
          phoneNumber={step.phoneNumber}
          onEditPhone={() => goTo({ name: "phone" })}
          onUseCode={({ forgot }) => goTo({ name: "code", phoneNumber: step.phoneNumber, sentAt: Date.now(), forgot })}
          onSignedIn={async (user) => {
            if (user.firstName) await finish();
            else goTo({ name: "name" });
          }}
        />
      )}

      {step.name === "code" && (
        <CodeStep
          phoneNumber={step.phoneNumber}
          sentAt={step.sentAt}
          showcase={showcase}
          onResent={(sentAt) => setStep({ ...step, sentAt })}
          onEditPhone={() => goTo({ name: "phone" })}
          onVerified={async (user) => {
            if (user.firstName) await finish(step.forgot ? NEW_PASSWORD_PATH : redirectTo);
            else goTo({ name: "name" });
          }}
        />
      )}

      {step.name === "name" && <NameStep focusOnMount={hasMoved} onDone={() => finish()} />}
    </section>
  );
}
