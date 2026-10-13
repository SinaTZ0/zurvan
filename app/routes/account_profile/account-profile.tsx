import { ORPCError } from "@orpc/client";
import { data } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { ProfileSettings } from "~/routes/account_profile/components/profile-settings";

import type { Route } from "./+types/account-profile";

// No guard of its own: `layout_account` already lets in customers and partners, and the Sheba API checks the partner
// role again on the server.

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "تنظیمات حساب | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request, context }: Route.LoaderArgs) {
  const { user } = context.get(sessionContext);
  const isPartner = user.role === "partner";

  // Only a partner has a Sheba. A partner user with no `partner` row is a broken account, not an empty page: the API
  // answers NOT_FOUND and the page's error boundary says so.
  const profile = isPartner
    ? await createServerClient(request)
        .partner.getMine()
        .catch((error: unknown) => {
          if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
          throw error;
        })
    : null;

  return {
    // The guard only lets named accounts through, so `firstName` is set.
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phoneNumber: user.phoneNumber ?? null,
    isPartner,
    shebaNumber: profile?.shebaNumber ?? null,
  };
}

/*===== Profile Settings =====*/
/**
 * F1's profile page for customers and partners: the name, and for a partner the Sheba the Admin pays commission to.
 * Your own tag is engraved as you type; the page itself is `ProfileSettings`.
 */
export default function AccountProfilePage({ loaderData }: Route.ComponentProps) {
  return <ProfileSettings {...loaderData} />;
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header stays on screen; the way back is the storefront, which both roles can reach.
export function ErrorBoundary() {
  return (
    <section aria-labelledby="profile-error-title" className="site-container py-16">
      <h1 id="profile-error-title" className="text-2xl font-extrabold">
        تنظیمات حساب باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به صفحه‌ی اصلی
      </Link>
    </section>
  );
}
