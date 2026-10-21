import { createFileRoute } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { cn } from "cn";
import { useQueryStates } from "nuqs";
import { useMemo, useRef, useState } from "react";
import { data, isRouteErrorResponse, useRevalidator } from "react-router";

import { requireSession } from "~/lib/session-guard.server";
import { createServerClient } from "~/orpc/server-client.server";
import { COLUMN } from "~/routes/account_partner_leads/column";
import { AddLeadForm } from "~/routes/account_partner_leads/components/add-lead-form";
import { HowItCounts } from "~/routes/account_partner_leads/components/how-it-counts";
import { LeadsError } from "~/routes/account_partner_leads/components/leads-error";
import { LeadsHero } from "~/routes/account_partner_leads/components/leads-hero";
import { LeadsList } from "~/routes/account_partner_leads/components/leads-list";
import { PageMotion } from "~/routes/account_partner_leads/components/page-motion";
import { PAGE_SIZE, partnerLeadsSearchParams } from "~/routes/account_partner_leads/search-params";
import { countPeople, filterPeople } from "~/routes/account_partner_leads/stages";

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
 *
 * The idea is the road: the center's dog takes the call in the hero and the numbers down in his notebook on the form's
 * plate (the start column, sticky on desktop); the list's plate lines every person's road up in one column, so the gold
 * reads down the list. Phones: the hero, the form, the note, then the list.
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
    <>
      <PageMotion />

      {/*===== Hero =====*/}
      <LeadsHero tally={{ lead: counts.lead, registered: counts.registered, bought: counts.bought }} />

      <div
        className={cn(
          COLUMN,
          "grid grid-cols-[minmax(0,1fr)] gap-y-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-10 xl:gap-x-12",
        )}
      >
        {/*===== Add a Number =====*/}
        {/* Sticky on desktop, so the form stays at hand while a long list scrolls past. */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
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

          {/*------ How It Counts ------*/}
          <HowItCounts />
        </div>

        {/*===== People =====*/}
        <LeadsList
          total={people.length}
          counts={counts}
          stage={stage}
          page={page}
          pageCount={pageCount}
          visiblePeople={visiblePeople}
          highlightedIds={highlightedIds}
          pending={pending}
          listRef={listRef}
          onStage={(next) => void setParams({ stage: next, page: null })}
          onPage={(next) => {
            // Paging is the one change the Back button should undo.
            void setParams({ page: next === 1 ? null : next }, { history: "push" });
            listRef.current?.scrollIntoView({ block: "start" });
          }}
        />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the account shell, so the header and the partner's tabs stay on screen.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  return <LeadsError notFound={isRouteErrorResponse(error) && error.status === 404} />;
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/account/partner/leads")({});
