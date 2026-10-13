import { cn } from "cn";
import { debounce, useQueryStates } from "nuqs";
import { useMemo, useRef } from "react";
import { isRouteErrorResponse, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { createServerClient } from "~/orpc/server-client.server";
import { DogRow } from "~/routes/admin_dogs/components/dog-row";
import { DogSearchField } from "~/routes/admin_dogs/components/dog-search-field";
import { countDogs, filterDogs, stateOf } from "~/routes/admin_dogs/filter-dogs";
import {
  adminDogsSearchParams,
  DOG_STATE_FILTERS,
  type DogStateFilter,
  PAGE_SIZE,
} from "~/routes/admin_dogs/search-params";

import type { Route } from "./+types/admin-dogs";

/*===== Constants =====*/
const STATE_LABELS: Record<DogStateFilter, string> = {
  all: "همه",
  none: "ارزیابی نشده",
  evaluated: "ارزیابی شده",
};

/** Typing waits this long before the URL moves: the list itself follows each key, the URL and history don't. */
const TYPING_DELAY_MS = 300;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "سگ‌ها | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. Both lists come whole: the search, the status filter, the counts and the paging are applied
// in the component, so changing them never waits for the server. Only the evaluation requests are read, to know which
// dogs are waiting for their answer.
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [dogs, requests] = await Promise.all([
    client.dog.admin.list(),
    client.evaluation.admin.list({ status: "requested" }),
  ]);
  return { dogs, waitingDogIds: requests.map((evaluation) => evaluation.dog.id) };
}

/*===== Admin Dogs =====*/
/**
 * F2 for the Admin: the register of every dog. Each row is the dog's face, its owner to call, the courses it has passed
 * and a stamp for where it is on the road. The page writes nothing: a dog is never added or deleted here.
 */
export default function AdminDogsPage({ loaderData }: Route.ComponentProps) {
  const { dogs, waitingDogIds } = loaderData;

  /*------ URL State ------*/
  const [{ q, state, page: requestedPage }, setParams] = useQueryStates(adminDogsSearchParams);

  /*------ Pending ------*/
  const revalidator = useRevalidator();
  const pending = revalidator.state !== "idle";

  /*------ Derived Lists ------*/
  const waiting = useMemo(() => new Set(waitingDogIds), [waitingDogIds]);
  const counts = useMemo(() => countDogs({ dogs }), [dogs]);
  const matches = useMemo(() => filterDogs({ dogs, waiting, query: q, state }), [dogs, waiting, q, state]);

  // A page past the end (an old link, or the last match going away) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleDogs = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const listRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="سگ‌ها"
        summary={`${formatNumberFa(dogs.length)} سگ، ${formatNumberFa(counts.evaluated)} تا ارزیابی‌شده`}
      />

      {dogs.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState bubble="هنوز سگی ثبت نشده" title="سگی نیست">
          وقتی صاحبی برای سگش پروفایل بسازد، اینجا می‌آید.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Search and Filter =====*/}
          <div className="mb-4 flex flex-col gap-4">
            <DogSearchField
              value={q}
              onChange={(value) =>
                void setParams(
                  { q: value || null, page: null },
                  { history: "replace", limitUrlUpdates: debounce(TYPING_DELAY_MS) },
                )
              }
              onClear={() => void setParams({ q: null, page: null }, { history: "replace" })}
            />
            <AdminFilterPills
              label="وضعیت ارزیابی"
              options={DOG_STATE_FILTERS.map((value) => ({ value, label: STATE_LABELS[value], count: counts[value] }))}
              value={state}
              onChange={(next) => void setParams({ state: next, page: null })}
            />
          </div>

          {/*===== The Register =====*/}
          <div
            ref={listRef}
            aria-busy={pending}
            className={cn("scroll-mt-24 transition-opacity", pending && "opacity-60")}
          >
            {matches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                <p>سگی با این مشخصات پیدا نشد</p>
                {q !== "" && (
                  <button
                    type="button"
                    onClick={() => void setParams({ q: null, page: null }, { history: "replace" })}
                    className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-2 text-foreground" })}
                  >
                    پاک کردن جستجو
                  </button>
                )}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {visibleDogs.map((dog) => (
                  <DogRow key={dog.id} dog={dog} state={stateOf({ dog, waiting })} />
                ))}
              </ul>
            )}
          </div>

          {/*===== Pages =====*/}
          {pageCount > 1 && (
            <Pagination
              label="صفحه‌های سگ‌ها"
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
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-dogs-error-title">
      <h1 id="admin-dogs-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "سگ‌ها باز نشدند"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/admin" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به مدیریت
      </Link>
    </section>
  );
}
