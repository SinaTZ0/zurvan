import { isRouteErrorResponse } from "react-router";

import { requireSession } from "~/lib/session-guard.server";
import type { Media } from "~/orpc/media/contract";
import { createServerClient } from "~/orpc/server-client.server";
import type { AccountLayoutHandle } from "~/routes/layout_account/layout-account";

import type { Route } from "./+types/account-purchases";
import { COLUMN } from "./column";
import { NextCourseBand } from "./components/next-course-band";
import { NoPurchases } from "./components/no-purchases";
import { PageMotion } from "./components/page-motion";
import { PurchasesError } from "./components/purchases-error";
import { PurchasesHero } from "./components/purchases-hero";
import { SlipsSection } from "./components/slips-section";

/*===== Handle =====*/
// The page ends on its brick band, which runs straight into the footer: the account shell drops `main`'s bottom
// padding when a page's handle sets this.
export const handle: AccountLayoutHandle = { flushFooter: true };

/*===== Guard =====*/
// The account layout lets partners in too, but payments are a customer's (docs/app-spec.md, F5).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["customer"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "خریدها | آموزش K9" }];

/*===== Loader =====*/
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  // The dogs are read only for their photos: a payment item carries just the dog's id and name.
  const [payments, refunds, dogs] = await Promise.all([
    client.checkout.payments(),
    client.refund.listMine(),
    client.dog.list(),
  ]);

  /*------ Order ------*/
  // The API already returns newest first; sorting again keeps the page right if that ever changes.
  // oxlint-disable-next-line unicorn/no-array-sort -- a fresh array from the spread.
  const sorted = [...payments].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  /*------ Photos ------*/
  const photos: Record<string, Media | null> = Object.fromEntries(dogs.map((dog) => [dog.id, dog.photo]));

  /*------ Tally ------*/
  // The hero's three numbers, from the paid payments only: a failed or pending one bought nothing.
  const paidItems = sorted.filter((payment) => payment.status === "paid").flatMap((payment) => payment.items);
  const tally = {
    payments: sorted.filter((payment) => payment.status === "paid").length,
    courses: paidItems.length,
    training: paidItems.filter((item) => item.enrollment?.status === "active").length,
  };

  return { payments: sorted, refunds, photos, tally };
}

/*===== Purchases =====*/
/**
 * F5's record of what was paid, «خریدها»: the center's dog keeps the receipts in his book. The hero with the tally, then
 * one paper slip per payment (the dog and course on each line, what each turned into, what was given back), and the
 * closing brick band towards the next course. The app only records; there is nothing to pay or edit here.
 */
export default function AccountPurchasesPage({ loaderData }: Route.ComponentProps) {
  const { payments, refunds, photos, tally } = loaderData;

  return (
    <>
      <PageMotion />

      {/*===== Hero =====*/}
      <PurchasesHero tally={tally} />

      {/*===== Slips =====*/}
      <div className={COLUMN}>
        {payments.length === 0 ? (
          <NoPurchases />
        ) : (
          <SlipsSection payments={payments} refunds={refunds} photos={photos} />
        )}
      </div>

      {/*===== Next Course =====*/}
      <NextCourseBand />
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so a failed list still has the header, the footer and a way on.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <PurchasesError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}
