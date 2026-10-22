import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { localizedPath } from "~/lib/i18n";
import { pageHead } from "~/lib/seo";
import { m } from "~/paraglide/messages";
import { SITE_RULES } from "~/lib/site-rules";
import { LanguageSwitch } from "~/components/language-switch";
import { orpc } from "~/orpc/client";
import type { AuthStepName } from "~/routes/auth/auth-scenes";
import { AuthStage } from "~/routes/auth/components/auth-stage";
import { SignInFlow } from "~/routes/auth/components/sign-in-flow";
import { TrustNote } from "~/routes/auth/components/trust-note";

/** Where people land after signing in when nothing asked for a page. The account area sends each role on from there. */
const DEFAULT_REDIRECT = "/account";

/*===== Search =====*/
// `redirectTo`: the page to return to after signing in (the guards and sign-out send it). A partner's `?ref=` code is
// remembered by the server before the page renders (`app/start.ts`), so the page itself doesn't read it.
const authSearchSchema = z.object({ redirectTo: z.string().optional().catch(undefined) });

/*===== Route =====*/
export const Route = createFileRoute("/auth")({
  validateSearch: authSearchSchema,
  // Signed-in people have nothing to do here, unless their new account still has no name. A blocked account's
  // sessions are revoked on the way, so it reads as signed out and starts again at the phone step.
  beforeLoad: async ({ context: { queryClient }, search }) => {
    const session = await queryClient.ensureQueryData(orpc.session.get.queryOptions());
    // `redirectTo` is an internal path; a redirect's `href` skips the router's rewrite, so it is put in the page's
    // language here (`/en/account` for someone signing in on the English site).
    if (session.status === "active") {
      throw redirect({ href: localizedPath({ path: safeRedirect(search.redirectTo) }) });
    }
  },
  // What the page starts from, kept as the loader's answer rather than read from the cache: signing in clears the cache
  // (`SignInFlow`), and the page must not lose its footing while it navigates on.
  loader: async ({ context: { queryClient } }) => {
    const [session, site] = await Promise.all([
      queryClient.ensureQueryData(orpc.session.get.queryOptions()),
      queryClient.ensureQueryData(orpc.site.config.queryOptions()),
    ]);
    return {
      showcase: site.showcase,
      needsName: session.status === "unnamed",
      // The name step asks for the tick only when approved rules exist (F13).
      rulesPublished: SITE_RULES !== null,
    };
  },
  head: () =>
    pageHead({ path: "/auth", title: m.auth_meta_title(), description: m.auth_meta_description() }),
  component: AuthPage,
});

/** Only same-site paths, so a crafted `?redirectTo=` link can't send someone to another site after signing in. */
function safeRedirect(value: string | undefined) {
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
function AuthPage() {
  const { showcase, needsName, rulesPublished } = Route.useLoaderData();
  const redirectTo = safeRedirect(Route.useSearch().redirectTo);
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
            aria-label={m.auth_logo_label()}
            className="absolute start-4 top-5 z-20 self-start rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:start-6 lg:static lg:mb-10"
          >
            <BrandLogo />
          </Link>

          <div className="flex flex-col max-lg:pt-7 lg:my-auto">
            {/*------ Welcome ------*/}
            <header>
              <h1 className={`${DISPLAY_HEADING} text-h1 text-balance`}>
                {m.auth_welcome_lead()} <span className="text-primary">{m.auth_welcome_accent()}</span>
              </h1>
              <p className="mt-3 text-pretty text-muted-foreground">{m.auth_welcome_note()}</p>
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
