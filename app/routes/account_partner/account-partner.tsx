import { createFileRoute } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { COLUMN } from "~/routes/account_partner/column";
import { CommissionPlate } from "~/routes/account_partner/components/commission-plate";
import { FunnelPlate } from "~/routes/account_partner/components/funnel-plate";
import { PageMotion } from "~/routes/account_partner/components/page-motion";
import { PartnerError } from "~/routes/account_partner/components/partner-error";
import { PartnerHero } from "~/routes/account_partner/components/partner-hero";
import { PartnerNotices } from "~/routes/account_partner/components/partner-notices";
import { ShopCard } from "~/routes/account_partner/components/shop-card";
import type { PartnerFunnel } from "~/routes/account_partner/funnel";

import type { Route } from "./+types/account-partner";

/*===== Guard =====*/
// The account layout lets customers in too, but the partner's pages are his alone (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["partner"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "همکاری من | آموزش K9" }];

/*===== Loader =====*/
/**
 * The partner's shop card, funnel and commissions. A partner user with no `partner` row is a broken account: the
 * API answers NOT_FOUND, and that becomes a 404 the error boundary explains, not an empty page.
 */
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = context.get(sessionContext);
  const client = createServerClient(request);

  const [profile, commissions, leads] = await Promise.all([
    client.partner.getMine().catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    }),
    client.commission.listMine(),
    client.partner.leads.list(),
  ]);

  /*------ Funnel ------*/
  // Lost people are not this partner's to count. «ثبت‌نام‌شده» includes those who went on to buy, as the road shows.
  const funnel: PartnerFunnel = {
    numbers: leads.filter((person) => person.stage !== "lost").length,
    registered: leads.filter((person) => person.stage === "registered" || person.stage === "bought").length,
    bought: leads.filter((person) => person.stage === "bought").length,
  };

  /*------ Commissions ------*/
  // Newest first, so a fresh commission is the first thing a partner reads.
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from the spread.
  const sorted = [...commissions].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const unpaidAmount = sorted.filter((c) => c.paidAt === null).reduce((sum, c) => sum + c.amount, 0);
  const paidAmount = sorted.filter((c) => c.paidAt !== null).reduce((sum, c) => sum + c.amount, 0);

  return {
    firstName: user.firstName,
    isActive: profile.isActive,
    shebaNumber: profile.shebaNumber,
    commissionPercent: profile.commissionPercent,
    // The referral link lands on the home page; the QR is the same link as a code the customer's phone can scan.
    link: profile.link,
    qr: profile.qr,
    funnel,
    commissions: sorted,
    unpaidAmount,
    paidAmount,
  };
}

/*===== Partner Dashboard =====*/
/**
 * F7's partner home, «همکاری من»: the center's dog visits the partner's shop. The hero greets him with the funnel's
 * tally, the notices say what stands between him and his commission, and the grid holds his shop card (the QR on the
 * counter, the link, the PNG; sticky at the start on desktop) beside the people his link brought and what he is owed.
 * Shows amounts and customers' names only (F12): nothing about prices, dogs or other partners, because the API sends
 * nothing more.
 */
export default function AccountPartnerPage({ loaderData }: Route.ComponentProps) {
  const {
    firstName,
    isActive,
    shebaNumber,
    commissionPercent,
    link,
    qr,
    funnel,
    commissions,
    unpaidAmount,
    paidAmount,
  } = loaderData;

  return (
    <>
      <PageMotion />

      {/*===== Hero =====*/}
      <PartnerHero firstName={firstName} funnel={funnel} />

      <div className={COLUMN}>
        {/*===== Notices =====*/}
        <PartnerNotices isActive={isActive} hasSheba={shebaNumber !== null} />

        {/*===== Two Columns From lg =====*/}
        {/* The shop card comes first in the document, so the phone reads it before the funnel and commissions. It is
            sticky only where the screen is tall enough to show all of it. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-y-12 lg:grid-cols-12 lg:items-start lg:gap-x-8">
          <div className="lg:col-span-5 lg:[@media(min-height:52rem)]:sticky lg:[@media(min-height:52rem)]:top-6">
            <ShopCard link={link} qr={qr} />
          </div>

          <div className="flex flex-col gap-12 lg:col-span-7">
            <FunnelPlate funnel={funnel} />
            <CommissionPlate
              commissions={commissions}
              unpaidAmount={unpaidAmount}
              paidAmount={paidAmount}
              commissionPercent={commissionPercent}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header stays on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PartnerError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/account/partner")({});
