import { Link } from "~/components/link";
import { SHOW_FILTERS, type ShowFilter, StatusFilter } from "~/routes/trainer_enrollments/components/status-filter";
import { createServerClient } from "~/orpc/server-client.server";
import { FinishedLedger } from "~/routes/trainer_enrollments/components/finished-ledger";
import { LiveLedger } from "~/routes/trainer_enrollments/components/live-ledger";
import { WaitingList } from "~/routes/trainer_enrollments/components/waiting-list";

import type { Route } from "./+types/trainer-enrollments";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "شاگردها | آموزش K9" }];

/*===== Loader =====*/
function isLive(status: string): boolean {
  return status === "scheduling" || status === "active";
}

function parseShow(value: string | null): ShowFilter {
  return SHOW_FILTERS.find((filter) => filter === value) ?? "live";
}

export async function loader({ request }: Route.LoaderArgs) {
  const show = parseShow(new URL(request.url).searchParams.get("show"));
  const api = createServerClient(request).enrollment.trainer;

  // The list is cheap and already ordered for the trainer (waiting first, then by next session), so it is read whole and
  // the filter in the URL decides what is shown. That also gives the filter its counts.
  const summaries = await api.list({});
  const wanted = summaries.filter((summary) =>
    show === "all" ? true : show === "live" ? isLive(summary.status) : !isLive(summary.status),
  );

  // The summary has neither the owner's phone and preferred times nor the sessions (the strip needs them), so each
  // shown row is read in full. A trainer has a handful of dogs in training at once.
  const enrollments = await Promise.all(wanted.map((summary) => api.get({ id: summary.id })));

  return {
    show,
    counts: {
      live: summaries.filter((summary) => isLive(summary.status)).length,
      finished: summaries.filter((summary) => !isLive(summary.status)).length,
      all: summaries.length,
    } satisfies Record<ShowFilter, number>,
    waiting: enrollments.filter((enrollment) => enrollment.status === "scheduling"),
    active: enrollments.filter((enrollment) => enrollment.status === "active"),
    finished: enrollments
      .filter((enrollment) => !isLive(enrollment.status))
      .sort(
        (a, b) =>
          (b.completedAt ?? b.cancelledAt ?? b.createdAt).getTime() -
          (a.completedAt ?? a.cancelledAt ?? a.createdAt).getTime(),
      ),
    now: new Date(),
  };
}

/*===== Page =====*/
export default function TrainerEnrollmentsPage({ loaderData }: Route.ComponentProps) {
  const { show, counts, waiting, active, finished, now } = loaderData;
  const nothing = waiting.length + active.length + finished.length === 0;

  return (
    <div className="site-container flex flex-col gap-8 py-8 lg:gap-10 lg:py-12">
      {/*===== Header =====*/}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-balance lg:text-3xl">شاگردها</h1>
          <p className="mt-2 max-w-xl text-pretty text-muted-foreground">
            سگ‌هایی که منتظر اولین جلسه‌اند و سگ‌هایی که در آموزش‌اند.
          </p>
        </div>
        <StatusFilter current={show} counts={counts} />
      </header>

      {nothing && <EmptyState show={show} />}

      {/*===== Waiting =====*/}
      {waiting.length > 0 && (
        <div className="lg:max-w-176">
          <WaitingList enrollments={waiting} />
        </div>
      )}

      {/*===== In Training =====*/}
      {active.length > 0 && <LiveLedger enrollments={active} now={now} />}

      {/*===== Finished =====*/}
      {finished.length > 0 && <FinishedLedger enrollments={finished} />}
    </div>
  );
}

/*===== Empty State =====*/
function EmptyState({ show }: { show: ShowFilter }) {
  return (
    <p className="rounded-xl bg-sunken px-5 py-8 text-pretty text-muted-foreground">
      {show === "finished" ? (
        "هنوز آموزشی تمام نشده."
      ) : (
        <>
          هنوز شاگردی نداری. وقتی کسی دوره‌ای رزرو و پرداخت کند، اینجا می‌آید.{" "}
          <Link to="/trainer" className="font-bold text-primary underline-offset-4 hover:underline">
            برنامه‌ی من
          </Link>
        </>
      )}
    </p>
  );
}

/*===== Error Boundary =====*/
export function ErrorBoundary() {
  return (
    <section aria-labelledby="enrollments-error-title" className="site-container py-16">
      <h1 id="enrollments-error-title" className="text-2xl font-extrabold">
        شاگردها باز نشد
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
    </section>
  );
}
