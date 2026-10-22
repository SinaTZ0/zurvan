import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orNotFound } from "~/lib/not-found";
import { orpc } from "~/orpc/client";
import { ProfileError } from "~/routes/account_profile/components/profile-error";
import { ProfileSettings } from "~/routes/account_profile/components/profile-settings";

/*===== Route =====*/
// No guard of its own: `layout_account` already lets in customers and partners, and the Sheba API checks the partner
// role again on the server.
export const Route = createFileRoute("/account/profile")({
  loader: async ({ context: { queryClient, user } }) => {
    // Only a partner has a Sheba. A partner user with no `partner` row is a broken account, not an empty page: the API
    // answers NOT_FOUND and the page's error look says so.
    await Promise.all([
      user.role === "partner" ? orNotFound(queryClient.ensureQueryData(orpc.partner.getMine.queryOptions())) : null,
      queryClient.ensureQueryData(orpc.password.status.queryOptions()),
    ]);
  },
  head: () => ({ meta: [{ title: "تنظیمات حساب | آموزش K9" }] }),
  component: AccountProfilePage,
  // Inside the account shell, so the header and its way back stay on screen. A missing partner row gets the same look.
  notFoundComponent: ProfileError,
  errorComponent: ProfileError,
});

/*===== Profile Settings =====*/
/**
 * F1's profile page for customers and partners: the name, the password, and for a partner the Sheba the head trainer
 * pays commission to. The idea is the person's own tag on the house's hall stand, engraved as they type, with the
 * center's dog looking after each card; the page itself is `ProfileSettings`.
 */
function AccountProfilePage() {
  const { user } = Route.useRouteContext();
  const isPartner = user.role === "partner";
  const { data: password } = useSuspenseQuery(orpc.password.status.queryOptions());
  // Conditional, so not a suspense read; the loader has already put it in the cache for the server render.
  const { data: profile } = useQuery({ ...orpc.partner.getMine.queryOptions(), enabled: isPartner });

  return (
    <ProfileSettings
      firstName={user.firstName}
      lastName={user.lastName}
      phoneNumber={user.phoneNumber}
      isPartner={isPartner}
      shebaNumber={profile?.shebaNumber ?? null}
      hasPassword={password.hasPassword}
    />
  );
}
