import { createFileRoute } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { data } from "react-router";

import { sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { ProfileError } from "~/routes/account_profile/components/profile-error";
import { ProfileSettings } from "~/routes/account_profile/components/profile-settings";

import type { Route } from "./+types/account-profile";

// No guard of its own: `layout_account` already lets in customers and partners, and the Sheba API checks the partner
// role again on the server.

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "تنظیمات حساب | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(sessionContext);
  const isPartner = user.role === "partner";
  const client = createServerClient(request);

  // Only a partner has a Sheba. A partner user with no `partner` row is a broken account, not an empty page: the API
  // answers NOT_FOUND and the page's error boundary says so.
  const [profile, { hasPassword }] = await Promise.all([
    isPartner
      ? client.partner.getMine().catch((error: unknown) => {
          if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
          throw error;
        })
      : null,
    client.password.status(),
  ]);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    isPartner,
    shebaNumber: profile?.shebaNumber ?? null,
    hasPassword,
  };
}

/*===== Profile Settings =====*/
/**
 * F1's profile page for customers and partners: the name, the password, and for a partner the Sheba the head trainer
 * pays commission to. The idea is the person's own tag on the house's hall stand, engraved as they type, with the
 * center's dog looking after each card; the page itself is `ProfileSettings`.
 */
export default function AccountProfilePage({ loaderData }: Route.ComponentProps) {
  return <ProfileSettings {...loaderData} />;
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and its way back stay on screen.
export function ErrorBoundary() {
  return <ProfileError />;
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/account/profile")({});
