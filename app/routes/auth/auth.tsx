import { useState } from "react";
import { data, redirect } from "react-router";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { referralCookieFromUrl } from "~/lib/referral.server";
import { SITE_RULES } from "~/lib/site-rules";
import { createServerClient } from "~/orpc/server-client.server";
import type { AuthStepName } from "~/routes/auth/auth-scenes";
import { AuthStage } from "~/routes/auth/components/auth-stage";
import { SignInFlow } from "~/routes/auth/components/sign-in-flow";
import { TrustNote } from "~/routes/auth/components/trust-note";

import type { Route } from "./+types/auth";

/** Where people land after signing in when nothing asked for a page. The account area sends each role on from there. */
const DEFAULT_REDIRECT = "/account";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "ورود به آموزش K9" },
  { name: "description", content: "با شماره موبایلت وارد آموزش K9 شو، برای رزرو ارزیابی و دنبال کردن آموزش سگت." },
];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(new URL(request.url).searchParams.get("redirectTo"));
  const client = createServerClient(request);
  const [session, site, referralCookie] = await Promise.all([
    client.session.get(),
    client.site.config(),
    // A partner's link can land here too: remember its `?ref=` code so signup can attribute the customer (F7).
    referralCookieFromUrl(request.url, request.headers),
  ]);

  // Signed-in people have nothing to do here, unless their new account still has no name. A blocked account's
  // sessions are revoked on the way, so it reads as signed out and starts again at the phone step.
  if (session.status === "active") throw redirect(redirectTo);

  return data(
    // `rulesPublished`: the name step asks for the tick only when approved rules exist (F13).
    {
      showcase: site.showcase,
      redirectTo,
      needsName: session.status === "unnamed",
      rulesPublished: SITE_RULES !== null,
    },
    referralCookie ? { headers: { "Set-Cookie": referralCookie } } : undefined,
  );
}

/** Only same-site paths, so a crafted `?redirectTo=` link can't send someone to another site after signing in. */
function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : DEFAULT_REDIRECT;
}

/*===== Page =====*/
/**
 * The dog meets you at the door. The form is one grained plate on the paper, and the page's other half is a drawn night
 * scene (`AuthStage`): a front door with its lamp lit, and at each step a different dog waiting on the doorstep who asks
 * that step's question.
 *
 * Outside the storefront shell (no header, footer or tab bar). Desktop: one full-viewport band split in two; in RTL the
 * first column is the right one, so the form comes first in the DOM and sits on the start side, and the stage is the
 * left half. Phones: the stage is a band on top (moved first by `order`, so the form keeps the first place in the tab
 * order) with the logo laid over its start corner, and the plate follows.
 */
export default function AuthPage({ loaderData }: Route.ComponentProps) {
  const { showcase, redirectTo, needsName, rulesPublished } = loaderData;
  // Which dog is up follows the flow's step; the flow reports each change.
  const firstStep: AuthStepName = needsName ? "name" : "phone";
  const [step, setStep] = useState<AuthStepName>(firstStep);

  return (
    <main className="relative isolate flex min-h-svh flex-col bg-jet lg:grid lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      {/*===== Form Column =====*/}
      {/* Scrolls on its own on desktop, so the demo list never moves the stage. Its scrollbar is hidden; the wheel and touch still scroll it. */}
      <div className="z-10 [scrollbar-width:none] px-4 pt-6 pb-12 sm:px-6 lg:h-svh lg:overflow-y-auto lg:px-10 lg:pt-8 [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-full max-w-md flex-col lg:min-h-full">
          {/*------ Logo ------*/}
          {/* Phones: laid over the stage band's top start corner. Desktop: first in the column, scrolling with it. */}
          <Link
            to="/"
            aria-label="زروان، صفحه‌ی اصلی"
            className="absolute start-4 top-5 z-20 self-start rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:start-6 lg:static lg:mb-10"
          >
            <BrandLogo />
          </Link>

          <div className="flex flex-col max-lg:pt-7 lg:my-auto">
            {/*------ Welcome ------*/}
            <header>
              <h1 className={`${DISPLAY_HEADING} text-h1 text-balance`}>
                وارد شو، <span className="text-primary">منتظرتم</span>
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">بار اولته؟ حسابت همین‌جا ساخته می‌شه.</p>
            </header>

            {/*------ Steps ------*/}
            <div className="mt-6 lg:mt-8">
              <SignInFlow
                showcase={showcase}
                redirectTo={redirectTo}
                needsName={needsName}
                rulesPublished={rulesPublished}
                onStepChange={setStep}
              />
            </div>

            {/*------ Reassurance ------*/}
            <div className="mt-7">
              <TrustNote />
            </div>
          </div>
        </div>
      </div>

      {/*===== Stage =====*/}
      <AuthStage step={step} firstStep={firstStep} />
    </main>
  );
}
