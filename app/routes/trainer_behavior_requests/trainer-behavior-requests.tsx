import { createServerClient } from "~/orpc/server-client.server";
import { FinishedLedger } from "~/routes/trainer_behavior_requests/components/finished-ledger";
import { PlanLedger } from "~/routes/trainer_behavior_requests/components/plan-ledger";
import {
  STATUS_FILTERS,
  type StatusFilter,
  StatusFilterBar,
} from "~/routes/trainer_behavior_requests/components/status-filter";
import { WaitingList } from "~/routes/trainer_behavior_requests/components/waiting-list";

import type { Route } from "./+types/trainer-behavior-requests";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "درخواست‌های اصلاح رفتار | آموزش K9" }];

/*===== Loader =====*/
function parseFilter(value: string | null): StatusFilter {
  return STATUS_FILTERS.find((filter) => filter === value) ?? "open";
}

/** Which sections each filter shows, as the statuses that belong to it. */
const FILTER_SECTIONS: Record<StatusFilter, { waiting: boolean; plans: boolean; finished: boolean }> = {
  open: { waiting: true, plans: true, finished: false },
  answered: { waiting: false, plans: true, finished: true },
  all: { waiting: true, plans: true, finished: true },
};

export async function loader({ request }: Route.LoaderArgs) {
  const filter = parseFilter(new URL(request.url).searchParams.get("status"));

  // The API takes one status at a time and this filter spans several, so the whole list is read once and the URL
  // decides what is shown. Each section is sorted to what it needs: the longest wait first, the plan closest to its
  // deadline first, and the rest newest first.
  const requests = await createServerClient(request).behaviorRequest.trainer.list({});
  const waiting = requests
    .filter((item) => item.status === "submitted")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const plans = requests
    .filter((item) => item.status === "proposed")
    .sort((a, b) => (a.plan?.expiresAt.getTime() ?? 0) - (b.plan?.expiresAt.getTime() ?? 0));
  const finished = requests
    .filter((item) => item.status !== "submitted" && item.status !== "proposed")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    filter,
    counts: {
      open: waiting.length + plans.length,
      answered: plans.length + finished.length,
      all: requests.length,
    } satisfies Record<StatusFilter, number>,
    sections: FILTER_SECTIONS[filter],
    waiting,
    plans,
    finished,
    now: new Date(),
  };
}

/*===== Page =====*/
export default function TrainerBehaviorRequestsPage({ loaderData }: Route.ComponentProps) {
  const { filter, counts, sections, waiting, plans, finished, now } = loaderData;
  const shownPlans = sections.plans ? plans : [];
  const shownFinished = sections.finished ? finished : [];

  return (
    <div className="site-container flex flex-col gap-8 py-8 lg:gap-10 lg:py-12">
      {/*===== Header =====*/}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">درخواست‌های اصلاح رفتار</h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            درخواست‌هایی که منتظر جواب توست، و برنامه‌هایی که فرستاده‌ای.
          </p>
        </div>
        <StatusFilterBar current={filter} counts={counts} />
      </header>

      {/*===== Empty =====*/}
      {counts.all === 0 && (
        <p className="rounded-xl bg-sunken px-5 py-8 text-pretty text-muted-foreground">
          هنوز درخواست اصلاح رفتاری نرسیده. وقتی صاحب سگی درخواستش را بفرستد، اینجا می‌آید.
        </p>
      )}
      {counts.all > 0 && filter === "answered" && shownPlans.length + shownFinished.length === 0 && (
        <p className="rounded-xl bg-sunken px-5 py-8 text-pretty text-muted-foreground">هنوز جوابی نداده‌ای.</p>
      )}

      {/*===== Waiting =====*/}
      {counts.all > 0 && sections.waiting && (
        <div>
          {waiting.length > 0 ? (
            <WaitingList requests={waiting} now={now} />
          ) : (
            <p className="rounded-xl bg-sunken px-5 py-8 text-pretty text-muted-foreground">
              درخواستی منتظر جواب نیست.
            </p>
          )}
        </div>
      )}

      {/*===== Plans Out =====*/}
      {shownPlans.length > 0 && <PlanLedger requests={shownPlans} now={now} />}

      {/*===== Finished =====*/}
      {shownFinished.length > 0 && <FinishedLedger requests={shownFinished} />}
    </div>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary() {
  return (
    <section aria-labelledby="behavior-requests-error-title" className="site-container py-16">
      <h1 id="behavior-requests-error-title" className="text-2xl font-extrabold">
        درخواست‌ها باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
    </section>
  );
}
