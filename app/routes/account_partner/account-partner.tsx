import { ORPCError } from "@orpc/client";
import { data, isRouteErrorResponse } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { env } from "~/env.server";
import { CENTER_PHONE } from "~/lib/contact";
import { requireSession, sessionContext } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { PartnerBubble } from "~/routes/account_partner/components/partner-bubble";
import { PartnerNotices } from "~/routes/account_partner/components/partner-notices";
import { ShopCard } from "~/routes/account_partner/components/shop-card";
import { CommissionList } from "~/routes/account_partner/components/commission-list";
import { CommissionSummary } from "~/routes/account_partner/components/commission-summary";
import { FunnelStrip } from "~/routes/account_partner/components/funnel-strip";
import { buildReferralQr } from "~/routes/account_partner/qr.server";

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
  const { user } = context.get(sessionContext);
  const client = createServerClient(request);

  const [profile, commissions, leads] = await Promise.all([
    client.partner.getMine().catch((error: unknown) => {
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    }),
    client.commission.listMine(),
    client.partner.leads.list(),
  ]);

  /*------ Link And QR ------*/
  // The referral link lands on the home page; the QR is the same link as a code the customer's phone can scan.
  const link = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/?ref=${encodeURIComponent(profile.code)}`;

  /*------ Funnel ------*/
  // Lost people are not this partner's to count. «ثبت‌نام‌شده» includes those who went on to buy, as the card says.
  const funnel = {
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
    // The guard only lets named accounts through, so `firstName` is set.
    firstName: user.firstName ?? "",
    isActive: profile.isActive,
    shebaNumber: profile.shebaNumber,
    commissionPercent: profile.commissionPercent,
    link,
    qr: buildReferralQr({ link }),
    funnel,
    commissions: sorted,
    unpaidAmount,
    paidAmount,
  };
}

/*===== Partner Dashboard =====*/
/**
 * F7's partner home: his link and QR to put in the shop, the people it brought, and what he is owed. Shows amounts and
 * customers' names only (F12): nothing about prices, dogs or other partners, because the API sends nothing more.
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
    <div className="site-container py-8 lg:py-14">
      {/*===== Header =====*/}
      <header className="mb-8 flex flex-col gap-6 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-display text-h1 font-black text-balance">همکاری من</h1>
        <PartnerBubble firstName={firstName} />
      </header>

      {/*===== Notices =====*/}
      <PartnerNotices isActive={isActive} hasSheba={shebaNumber !== null} className="mb-8 lg:mb-10" />

      {/*===== Two Columns From xl =====*/}
      {/* The shop card comes first in the document, so the phone reads it before the funnel and commissions. */}
      <div className="xl:grid xl:grid-cols-12 xl:items-start xl:gap-8">
        <div className="xl:sticky xl:top-24 xl:col-span-5">
          <ShopCard link={link} qr={qr} />
        </div>

        <div className="mt-10 flex flex-col gap-10 xl:col-span-7 xl:mt-0">
          <FunnelStrip funnel={funnel} />
          <CommissionSummary
            unpaidAmount={unpaidAmount}
            paidAmount={paidAmount}
            commissionPercent={commissionPercent}
          />
          <CommissionList commissions={commissions} />
        </div>
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header stays on screen. A partner with no `partner` row gets the contact line, not
// a retry: retrying can't create the row.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="partner-error-title" className="site-container py-16">
      <h1 id="partner-error-title" className="text-2xl font-extrabold">
        {notFound ? "حساب همکاری‌ات کامل نیست" : "صفحه‌ی همکاری باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {notFound
          ? "با مرکز تماس بگیر تا حسابت را کامل کنند."
          : "مشکلی پیش آمد. صفحه را دوباره باز کن یا با مرکز تماس بگیر."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {!notFound && (
          <Link to="/account/partner" className={buttonVariants({ size: "lg" })}>
            دوباره امتحان کن
          </Link>
        )}
        <a href={`tel:${CENTER_PHONE.tel}`} className={buttonVariants({ size: "lg", variant: "outline" })}>
          <bdi dir="ltr">{CENTER_PHONE.display}</bdi>
        </a>
      </div>
    </section>
  );
}
