import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";

import { CodeStep } from "~/routes/auth/components/code-step";
import { NameStep } from "~/routes/auth/components/name-step";
import { PhoneStep } from "~/routes/auth/components/phone-step";

type Step = { name: "phone" } | { name: "code"; phoneNumber: string; sentAt: number } | { name: "name" };

const STEP_TITLES: Record<Step["name"], string> = {
  phone: "شماره موبایلت را بنویس",
  code: "کد پیامک را بنویس",
  name: "خوش آمدی! اسمت چیست؟",
};

/*===== Sign-in Flow =====*/
/**
 * Phone → code → (first time only) name. Signing in and signing up are the same two steps (spec 2): a number seen
 * for the first time becomes a customer account when its code is verified, and only then is the name asked.
 */
export function SignInFlow({
  showcase,
  redirectTo,
  needsName,
}: {
  showcase: boolean;
  redirectTo: string;
  /** Signed in already but never named (e.g. the tab closed after the code), so start at the name. */
  needsName: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(needsName ? { name: "name" } : { name: "phone" });
  // Kept when going back from the code step, so fixing one digit doesn't mean typing it all again.
  const [lastPhoneNumber, setLastPhoneNumber] = useState("");
  // Focus follows the person from step to step, but the page doesn't grab it on load.
  const [hasMoved, setHasMoved] = useState(false);
  const goTo = (next: Step) => {
    setHasMoved(true);
    setStep(next);
  };

  async function finish() {
    // Drop anything cached for a previous account before showing this one's data.
    queryClient.clear();
    await navigate(redirectTo, { viewTransition: true });
  }

  return (
    <section aria-labelledby="sign-in-step-title" className="flex flex-col gap-5">
      <h2 id="sign-in-step-title" className="text-h4">
        {STEP_TITLES[step.name]}
      </h2>

      {step.name === "phone" && (
        <PhoneStep
          defaultPhoneNumber={lastPhoneNumber}
          showcase={showcase}
          focusOnMount={hasMoved}
          onSent={(phoneNumber) => {
            setLastPhoneNumber(phoneNumber);
            goTo({ name: "code", phoneNumber, sentAt: Date.now() });
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
            if (user.firstName) await finish();
            else goTo({ name: "name" });
          }}
        />
      )}

      {step.name === "name" && <NameStep focusOnMount={hasMoved} onDone={finish} />}
    </section>
  );
}
