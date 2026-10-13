import { cn } from "cn";
import { debounce, useQueryStates } from "nuqs";
import { useLocation, useNavigation } from "react-router";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { FAMILY_TABS, familiesWithCourses, isShownFamily } from "~/lib/course-families";
import { createServerClient } from "~/orpc/server-client.server";
import { CatalogueHeader } from "~/routes/course_catalogue/components/catalogue-header";
import { EvaluationAsk } from "~/routes/course_catalogue/components/evaluation-ask";
import { FamilyShelf } from "~/routes/course_catalogue/components/family-shelf";
import { NoResults } from "~/routes/course_catalogue/components/no-results";
import { ResultsGrid } from "~/routes/course_catalogue/components/results-grid";
import { SearchField } from "~/routes/course_catalogue/components/search-field";
import {
  catalogueSearchParams,
  isCatalogueFamily,
  loadCatalogueSearchParams,
  MAX_QUERY_LENGTH,
  PAGE_SIZE,
} from "~/routes/course_catalogue/search-params";
import { matchesQuery } from "~/routes/course_catalogue/search";

import type { Route } from "./+types/course-catalogue";

/** How long typing pauses before the URL (and so the list) follows it. Enter doesn't wait. */
const TYPING_DELAY_MS = 350;

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [
  { title: "دوره‌ها | آموزش K9" },
  { name: "description", content: "همه‌ی دوره‌های آموزش K9 را ببین و بگرد؛ هر دوره بعد از دوره‌ی قبلش باز می‌شود." },
];

/*===== Loader =====*/
// Public: anyone can browse. The URL (`q`, `family`, `page`) is the whole state, so a search can be shared and the page
// renders the same on the server. Behavior-modification courses never reach the list (`isShownFamily`).
export async function loader({ request }: Route.LoaderArgs) {
  const params = loadCatalogueSearchParams(request);
  const query = params.q.trim().slice(0, MAX_QUERY_LENGTH);

  const courses = await createServerClient(request).course.list();

  /*------ Family ------*/
  // A family with no course has no tab, so a link to it falls back to showing everything rather than an empty list.
  const tabs = familiesWithCourses(courses);
  const family = tabs.some((tab) => tab.family === params.family) ? params.family : null;
  const familyLabel = FAMILY_TABS.find((tab) => tab.family === family)?.label ?? null;

  /*------ Filter ------*/
  const matching = courses.filter(
    (course) =>
      isShownFamily(course.family) && (family === null || course.family === family) && matchesQuery({ course, query }),
  );

  /*------ Page ------*/
  // A page past the end (an old link, or a search that got narrower) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(Math.max(params.page, 1), pageCount);

  return {
    courses: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    tabs,
    total: matching.length,
    query,
    family,
    familyLabel,
    page,
    pageCount,
  };
}

/*===== Page =====*/
export default function CourseCataloguePage({ loaderData }: Route.ComponentProps) {
  const { courses, tabs, total, query, familyLabel, page, pageCount } = loaderData;

  /*------ URL State ------*/
  // This route owns the hook; the pieces below get plain values and callbacks. Changing the search or the family
  // always sends the visitor back to the first page.
  const [params, setParams] = useQueryStates(catalogueSearchParams);

  /*------ Pending ------*/
  // Only a change to this page's own URL dims the list; leaving for a course page shouldn't flash it.
  const location = useLocation();
  const navigation = useNavigation();
  const pending = navigation.state !== "idle" && navigation.location?.pathname === location.pathname;

  return (
    <>
      {/*===== Header, Search and the Dog =====*/}
      <CatalogueHeader total={total} query={query} familyLabel={familyLabel}>
        <SearchField
          value={params.q}
          family={params.family}
          onChange={(value) =>
            setParams({ q: value || null, page: null }, { limitUrlUpdates: debounce(TYPING_DELAY_MS) })
          }
          onSubmit={(value) => setParams({ q: value.trim() || null, page: null })}
          onClear={() => setParams({ q: null, page: null })}
        />
      </CatalogueHeader>

      {/*===== The Shelf =====*/}
      <FamilyShelf
        tabs={tabs}
        value={params.family ?? "all"}
        onChange={(next) => setParams({ family: isCatalogueFamily(next) ? next : null, page: null })}
      />

      {/*===== Results =====*/}
      <div
        id="results"
        aria-busy={pending}
        className={cn("site-container scroll-mt-24 pt-8 transition-opacity sm:pt-10", pending && "opacity-60")}
      >
        {total === 0 ? (
          <NoResults />
        ) : (
          <ResultsGrid
            courses={courses}
            page={page}
            pageCount={pageCount}
            // Paging is the one change the Back button should undo.
            onPageChange={(next) => setParams({ page: next === 1 ? null : next }, { history: "push" })}
          />
        )}
      </div>

      {/*===== The Ask =====*/}
      <div className="site-container py-section-sm">
        <EvaluationAsk />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a failed list still has the header and footer. The retry is a full page load: the
// loader runs again and nothing half-hydrated is left behind.
export function ErrorBoundary() {
  const { pathname, search } = useLocation();

  return (
    <section aria-labelledby="catalogue-error-title" className="site-container py-section-md">
      <div className="max-w-xl">
        <h1 id="catalogue-error-title" className="font-display text-h1 font-black text-balance">
          فهرست دوره‌ها باز نشد
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">
          مشکلی پیش آمد و دوره‌ها نرسیدند. دوباره امتحان کن یا چند دقیقه‌ی دیگر سر بزن.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`${pathname}${search}`} reloadDocument className={buttonVariants({ variant: "solid", size: "lg" })}>
            دوباره امتحان کن
          </Link>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            ارزیابی رایگان بگیر
          </Link>
        </div>
      </div>
    </section>
  );
}
