import { redirect } from "react-router";

import { BrandLogo } from "~/components/brand-logo";
import { env } from "~/env.server";
import { auth } from "~/lib/auth.server";
import { AuthBanner } from "~/routes/auth/components/auth-banner";
import { SignInFlow } from "~/routes/auth/components/sign-in-flow";
import { TrustNote } from "~/routes/auth/components/trust-note";

import type { Route } from "./+types/auth";

/** Where people land after signing in when nothing asked for a page. The Dogs List will replace the old pets page. */
const DEFAULT_REDIRECT = "/pets";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "ورود به آموزش K9" },
  { name: "description", content: "با شماره موبایلت وارد آموزش K9 شو، برای رزرو ارزیابی و دنبال کردن آموزش سگت." },
];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const redirectTo = safeRedirect(new URL(request.url).searchParams.get("redirectTo"));
  const session = await auth.api.getSession({ headers: request.headers });

  // Signed-in people have nothing to do here, unless their new account still has no name.
  if (session?.user.firstName) throw redirect(redirectTo);

  return { showcase: env.SHOWCASE_MODE, redirectTo, needsName: !!session };
}

/** Only same-site paths, so a crafted `?redirectTo=` link can't send someone to another site after signing in. */
function safeRedirect(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : DEFAULT_REDIRECT;
}

/*===== Page =====*/
export default function AuthPage({ loaderData }: Route.ComponentProps) {
  const { showcase, redirectTo, needsName } = loaderData;

  return (
    // Desktop splits the screen in two. In RTL the first column is the right one, so the banner comes
    // first in the DOM to sit on the right with the form on the left; it's also the reading order.
    <main className="min-h-svh lg:grid lg:grid-cols-2">
      {/*===== Banner =====*/}
      {/* Sticky so it stays framed beside the form when the showcase list makes the page scroll. */}
      <div className="sticky top-0 hidden h-svh p-4 lg:block">
        <AuthBanner className="h-full" />
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col px-4 py-10 sm:py-16 lg:justify-center">
        {/*===== Welcome =====*/}
        <header className="flex flex-col items-center text-center">
          {/* Desktop shows the logo in the banner instead. */}
          <BrandLogo className="text-[2.5rem] lg:hidden" />
          <h1 className="mt-4 font-display text-[2rem] leading-tight font-bold text-primary lg:mt-0">
            به آموزش K9 خوش آمدی
          </h1>
          <p className="mt-3 max-w-72 text-pretty text-muted-foreground">
            با شماره موبایلت وارد شو. بار اول است؟ حسابت همین‌جا ساخته می‌شود.
          </p>
        </header>

        {/*===== Steps =====*/}
        <div className="mt-8">
          <SignInFlow showcase={showcase} redirectTo={redirectTo} needsName={needsName} />
        </div>

        {/*===== Reassurance =====*/}
        <div className="mt-8">
          <TrustNote />
        </div>
      </div>
    </main>
  );
}
