import { useState } from "react";
import { data, redirect } from "react-router";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { env } from "~/env.server";
import { authForHeaders } from "~/lib/auth.server";
import { referralCookieFromUrl } from "~/lib/referral.server";
import type { AuthStepName } from "~/routes/auth/auth-scenes";
import { AuthBubble } from "~/routes/auth/components/auth-bubble";
import { AuthPhotos } from "~/routes/auth/components/auth-photos";
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
  const [session, referralCookie] = await Promise.all([
    authForHeaders(request.headers).api.getSession({ headers: request.headers }),
    // A partner's link can land here too: remember its `?ref=` code so signup can attribute the customer (F7).
    referralCookieFromUrl(request.url, request.headers),
  ]);

  // Signed-in people have nothing to do here, unless their new account still has no name.
  if (session?.user.firstName) throw redirect(redirectTo);

  return data(
    { showcase: env.SHOWCASE_MODE, redirectTo, needsName: !!session },
    referralCookie ? { headers: { "Set-Cookie": referralCookie } } : undefined,
  );
}

/** Only same-site paths, so a crafted `?redirectTo=` link can't send someone to another site after signing in. */
function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : DEFAULT_REDIRECT;
}

/*===== Page =====*/
/**
 * The home hero turned into a form: the dog's photo fills the page, the form sits in its dark half with no box, and a
 * different dog asks at each step (the photo crossfades, the bubble's words change).
 */
export default function AuthPage({ loaderData }: Route.ComponentProps) {
  const { showcase, redirectTo, needsName } = loaderData;
  // Which dog is up follows the flow's step; the flow reports each change.
  const [step, setStep] = useState<AuthStepName>(needsName ? "name" : "phone");

  return (
    // Desktop: one full-viewport band split in two. In RTL the first column is the right one, so the form comes first in
    // the DOM and sits on the start side; the photo is absolute behind both, so its dog fills the other half.
    <main className="relative isolate flex min-h-svh flex-col bg-jet lg:grid lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      {/*===== Photo =====*/}
      <AuthPhotos step={step} />

      {/*===== Form Column =====*/}
      {/* Scrolls on its own on desktop, so the demo list never moves the photo. Its scrollbar is hidden; the wheel and touch still scroll it. */}
      <div className="z-10 flex flex-col px-4 pt-6 pb-12 sm:px-6 lg:h-svh lg:overflow-y-auto lg:pe-10 lg:ps-20 lg:pt-8 xl:ps-24 lg:pb-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/*------ Logo ------*/}
        {/* Phones: laid over the photo band's top start corner. Desktop: first in the column, scrolling with it. */}
        <Link
          to="/"
          aria-label="زروان، صفحه‌ی اصلی"
          className="absolute start-4 top-5 z-20 self-start rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:start-6 lg:static lg:mb-10"
        >
          <BrandLogo />
        </Link>

        {/*------ Bubble ------*/}
        <AuthBubble step={step} />

        <div className="flex w-full max-w-md flex-col max-lg:mx-auto lg:my-auto">
          {/*------ Welcome ------*/}
          <header>
            <h1 className="font-display text-h1 font-black text-balance">وارد شو، منتظرتم</h1>
            <p className="mt-3 text-pretty text-muted-foreground">بار اول است؟ حسابت همین‌جا ساخته می‌شود.</p>
          </header>

          {/*------ Steps ------*/}
          <div className="mt-8">
            <SignInFlow showcase={showcase} redirectTo={redirectTo} needsName={needsName} onStepChange={setStep} />
          </div>

          {/*------ Reassurance ------*/}
          <div className="mt-8">
            <TrustNote />
          </div>
        </div>
      </div>
    </main>
  );
}
