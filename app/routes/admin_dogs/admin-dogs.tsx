import { cn } from "cn";
import { PawPrintIcon } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useMemo, useRef, useState } from "react";
import { isRouteErrorResponse, useLocation, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Pagination } from "~/components/pagination";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import { formatNumberFa } from "~/lib/digits";
import { normalizeForSearch } from "~/lib/search";
import { createServerClient } from "~/orpc/server-client.server";
import { DogRow } from "~/routes/admin_dogs/components/dog-row";
import { DogSearchField } from "~/routes/admin_dogs/components/dog-search-field";
import { NoMatch } from "~/routes/admin_dogs/components/no-match";
import { REGISTER_COLUMNS, REGISTER_PADDING } from "~/routes/admin_dogs/components/register-columns";
import { ResultLine } from "~/routes/admin_dogs/components/result-line";
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

/** A changed list staggers only its first rows in; the rest of a long page is simply there. */
const STAGGERED = 6;
const RISE_STEP_S = 0.05;

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
 * F2 for the Admin: the register of every dog, read by faces and stamps. One plate holds the rows; each starts with the
 * dog's print and ends with its stamp, so he can run down either edge. The page writes nothing: a dog is never added or
 * deleted here, and the whole row is the way to its file.
 *
 * Motion only answers him: when a filter, a search or a page changes which dogs are listed, the first rows rise in, and
 * the result count pops. Nothing moves on load.
 */
export default function AdminDogsPage({ loaderData }: Route.ComponentProps) {
  const { dogs, waitingDogIds } = loaderData;

  /*------ URL State ------*/
  const [{ q, state, page: requestedPage }, setParams] = useQueryStates(adminDogsSearchParams);

  /*------ Pending ------*/
  // Only a reload of this page dims the register (a revalidation, or the rail's link to the page he is on); the URL
  // state is shallow, so typing and the pills never do, and leaving for another page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const pending =
    revalidator.state === "loading" ||
    (navigation.state !== "idle" && navigation.location?.pathname === location.pathname);

  /*------ Derived Lists ------*/
  const waiting = useMemo(() => new Set(waitingDogIds), [waitingDogIds]);
  const counts = useMemo(() => countDogs({ dogs }), [dogs]);
  const matches = useMemo(() => filterDogs({ dogs, waiting, query: q, state }), [dogs, waiting, q, state]);
  const searching = normalizeForSearch(q) !== "";
  // Only asked for by the no-match view, to say the dog is under «همه».
  const matchesInAll = useMemo(
    () =>
      searching && state !== "all" && matches.length === 0
        ? filterDogs({ dogs, waiting, query: q, state: "all" }).length
        : 0,
    [searching, state, matches.length, dogs, waiting, q],
  );

  // A page past the end (an old link, or the last match going away) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(requestedPage, 1), pageCount);
  const visibleDogs = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /*------ Motion ------*/
  // The rows rise in only once the listed dogs have changed (React's "adjust state on a prop change" pattern), never
  // on load. Keyed by the dogs on screen, not by the query, so a key that doesn't change the list moves nothing.
  const listKey = `${state}:${page}:${visibleDogs.map((dog) => dog.id).join(",")}`;
  const [lastListKey, setLastListKey] = useState(listKey);
  const [moved, setMoved] = useState(false);
  if (listKey !== lastListKey) {
    setLastListKey(listKey);
    setMoved(true);
  }

  /*------ Pager Scroll ------*/
  // A new page starts at the register's top, under the sticky header (`scroll-mt-24`).
  const listRef = useRef<HTMLElement>(null);
  function scrollToRegister() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    listRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }

  /*------ Handlers ------*/
  function clearSearch() {
    void setParams({ q: null, page: null }, { history: "replace" });
  }

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="سگ‌ها"
        // An empty register says so in its own plate, so the line under the title isn't a row of zeros.
        summary={
          dogs.length > 0
            ? `${formatNumberFa(dogs.length)} سگ، ${formatNumberFa(counts.evaluated)} تا ارزیابی‌شده`
            : undefined
        }
      />

      {dogs.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="هنوز سگی نیست" icon={PawPrintIcon}>
          وقتی یه صاحب برای سگش پروفایل بسازه، این‌جا میاد.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Search =====*/}
          <div className="flex flex-col gap-1.5">
            <DogSearchField
              value={q}
              onChange={(value) =>
                void setParams(
                  { q: value || null, page: null },
                  { history: "replace", limitUrlUpdates: debounce(TYPING_DELAY_MS) },
                )
              }
              onClear={clearSearch}
            />
            <div className="ps-5">
              <ResultLine searching={searching} count={matches.length} />
            </div>
          </div>

          {/*===== Filter =====*/}
          {/* A count that changes under him pops inside the pills themselves. */}
          <AdminFilterPills
            label="وضعیت ارزیابی"
            options={DOG_STATE_FILTERS.map((value) => ({ value, label: STATE_LABELS[value], count: counts[value] }))}
            value={state}
            onChange={(next) => void setParams({ state: next, page: null })}
            className="mt-3"
          />

          {/*===== The Register =====*/}
          <section
            ref={listRef}
            aria-labelledby="admin-dogs-register"
            aria-busy={pending}
            className={cn("mt-5 scroll-mt-24 transition-opacity", pending && "opacity-60")}
          >
            <h2 id="admin-dogs-register" className="sr-only">
              فهرست سگ‌ها
            </h2>

            {matches.length === 0 ? (
              <NoMatch
                key={listKey}
                query={q}
                searching={searching}
                state={state}
                matchesInAll={matchesInAll}
                onClear={clearSearch}
                onShowAll={() => void setParams({ state: "all", page: null })}
                className={cn(moved && "answer-in")}
              />
            ) : (
              <div className={cn(ADMIN_PLATE, "overflow-hidden")}>
                {/*------ Column Head ------*/}
                {/* Only where the row is one line in fixed tracks; the rows say the same to a screen reader. */}
                <div
                  aria-hidden
                  className={cn(
                    "hidden border-b py-2.5 text-xs text-muted-foreground xl:grid",
                    REGISTER_COLUMNS,
                    REGISTER_PADDING,
                    ADMIN_HAIRLINE,
                  )}
                >
                  <span>سگ</span>
                  <span>صاحب</span>
                  <span>دوره‌های گذرانده</span>
                  <span className="text-center">وضعیت</span>
                </div>

                {/*------ Rows ------*/}
                <ul key={listKey} className={cn("divide-y", ADMIN_HAIRLINE)}>
                  {visibleDogs.map((dog, index) => (
                    <DogRow
                      key={dog.id}
                      dog={dog}
                      state={stateOf({ dog, waiting })}
                      rise={moved && index < STAGGERED ? index * RISE_STEP_S : null}
                    />
                  ))}
                </ul>
              </div>
            )}
          </section>

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
                scrollToRegister();
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
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "سگ‌ها باز نشدن"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}
