import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { useMemo, useRef, useState } from "react";
import { data, isRouteErrorResponse, useRevalidator } from "react-router";

import { AdminFilterPills } from "~/components/admin-filter-pills";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { AddLeadForm } from "~/routes/account_partner_leads/components/add-lead-form";
import { HowItCounts } from "~/routes/account_partner_leads/components/how-it-counts";
import { LeadRow } from "~/routes/account_partner_leads/components/lead-row";
import { LeadsEmpty } from "~/routes/account_partner_leads/components/leads-empty";
import { LEAD_STAGE_FILTERS, PAGE_SIZE, partnerLeadsSearchParams } from "~/routes/account_partner_leads/search-params";
import { countPeople, filterPeople, STAGE_FILTER_LABELS } from "~/routes/account_partner_leads/stages";

import type { Route } from "./+types/account-partner-leads";

/*===== Guard =====*/
// The account layout lets customers in too; the partner's pages are his alone (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["partner"] })];

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "شماره‌ها و مشتری‌ها | آموزش K9" }];

/*===== Loader =====*/
// The whole list comes once: the stage pills, their counts and the paging are applied in the component, so changing
// them never waits for the server. `getMine` is only for `isActive`.
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [people, profile] = await Promise.all([
    client.partner.leads.list(),
    client.partner.getMine().catch((error: unknown) => {
      // A partner user with no `partner` row is a broken account, not an empty page.
      if (error instanceof ORPCError && error.code === "NOT_FOUND") throw data(null, { status: 404 });
      throw error;
    }),
  ]);
  return { people, isActive: profile.isActive };
}

/*===== Leads and Customers =====*/
/**
 * F7's second partner tab: the partner writes down the phone of someone about to sign up, then watches each person
 * move from number to sign-up to purchase on a small road. He sees names and dates only, never prices or dogs (F12).
 */
export default function AccountPartnerLeadsPage({ loaderData }: Route.ComponentProps) {
  const { people, isActive } = loaderData;

  /*------ URL State ------*/
  const [{ stage, page: requestedPage }, setParams] = useQueryStates(partnerLeadsSearchParams);

  /*------ Pending ------*/
  const revalidator = useRevalidator();
  const pending = revalidator.state !== "idle";

  /*------ The Row That Was Just Added ------*/
  // Found by comparing the ids before and after the revalidation, not by trusting the add's answer: the list is what
  // the partner sees, and a row that is not there cannot be highlighted. Adjusting state while rendering (not in an
  // effect) keeps it to one render, with no frame where the new row is there but not marked.
  const [knownPeople, setKnownPeople] = useState(people);
  const [awaitingNew, setAwaitingNew] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<ReadonlySet<string>>(new Set());
  if (people !== knownPeople) {
    setKnownPeople(people);
    if (awaitingNew) {
      const before = new Set(knownPeople.map((person) => person.id));
      setHighlightedIds(new Set(people.filter((person) => !before.has(person.id)).map((person) => person.id)));
      setAwaitingNew(false);
    }
  }

  /*------ Derived Lists ------*/
  const counts = useMemo(() => countPeople({ people }), [people]);
  const matches = useMemo(() => filterPeople({ people, stage }), [people, stage]);

  // A page past the end (an old link) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visiblePeople = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div className="site-container py-8 lg:py-14">
      <div className="mx-auto max-w-4xl">
        {/*===== Header =====*/}
        <header className="mb-6 lg:mb-8">
          <h1 className="font-display text-h1 font-black text-balance">شماره‌ها و مشتری‌ها</h1>
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">
            شماره‌ی کسی که قرار است ثبت‌نام کند را بنویس؛ اگر با همین شماره بیاید، به اسم تو ثبت می‌شود.
          </p>
        </header>

        {/*===== Add a Number =====*/}
        <AddLeadForm
          isActive={isActive}
          onAdded={(person) => {
            // The new person shows first on page one; a filter or page that hides them is dropped so he sees it land.
            void setParams({
              stage: stage === "all" || stage === person.stage ? undefined : "all",
              page: null,
            });
            setAwaitingNew(true);
            void revalidator.revalidate();
          }}
        />

        {/*===== How It Counts =====*/}
        <div className="mt-1 mb-6">
          <HowItCounts />
        </div>

        {people.length === 0 ? (
          /*===== Nobody Yet =====*/
          <LeadsEmpty />
        ) : (
          <>
            {/*===== Stage Pills =====*/}
            <AdminFilterPills
              label="مرحله"
              className="mb-4"
              options={LEAD_STAGE_FILTERS.map((value) => ({
                value,
                label: STAGE_FILTER_LABELS[value],
                count: counts[value],
              }))}
              value={stage}
              onChange={(next) => void setParams({ stage: next, page: null })}
            />

            {/*===== The List =====*/}
            <div
              ref={listRef}
              aria-busy={pending}
              className={cn("scroll-mt-24 transition-opacity", pending && "opacity-60")}
            >
              {matches.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  کسی در این مرحله نیست.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {visiblePeople.map((person) => (
                    <LeadRow key={person.id} person={person} highlighted={highlightedIds.has(person.id)} />
                  ))}
                </ul>
              )}
            </div>

            {/*===== Pages =====*/}
            {pageCount > 1 && (
              <Pagination
                label="صفحه‌های شماره‌ها"
                page={page - 1}
                pageCount={pageCount}
                className="mt-6"
                onPick={(next) => {
                  // Paging is the one change the Back button should undo.
                  void setParams({ page: next === 0 ? null : next + 1 }, { history: "push" });
                  listRef.current?.scrollIntoView({ block: "start" });
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and the partner's tabs stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="partner-leads-error-title" className="site-container py-16">
      <h1 id="partner-leads-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "صفحه‌ی شماره‌ها باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/account/partner" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به داشبورد
      </Link>
    </section>
  );
}
