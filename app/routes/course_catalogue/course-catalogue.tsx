import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useLocation, useNavigate, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import {
  type CatalogueSearch,
  catalogueSearchSchema,
  isCatalogueFamily,
  MAX_QUERY_LENGTH,
  PAGE_SIZE,
} from "~/lib/catalogue-search-params";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { FAMILY_TABS, familiesWithCourses, isShownFamily } from "~/lib/course-families";
import { pageHead } from "~/lib/seo";
import { orpc } from "~/orpc/client";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";
import { CatalogueHeader } from "~/routes/course_catalogue/components/catalogue-header";
import { EvaluationAsk } from "~/routes/course_catalogue/components/evaluation-ask";
import { FamilyShelf } from "~/routes/course_catalogue/components/family-shelf";
import { NoResults } from "~/routes/course_catalogue/components/no-results";
import { ResultsGrid } from "~/routes/course_catalogue/components/results-grid";
import { CATALOGUE_COLUMN } from "~/routes/course_catalogue/layout";
import { matchesQuery } from "~/routes/course_catalogue/search";

/*===== Route =====*/
// Public: anyone can browse. The URL (`q`, `family`, `page`) is the whole state, so a search can be shared and the page
// renders the same on the server. The whole course list is one read, and the URL only picks from it, so the search
// isn't a loader dependency: changing it filters the cached list without asking the server again.
export const Route = createFileRoute("/_public/courses")({
  validateSearch: catalogueSearchSchema,
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(orpc.course.list.queryOptions()),
  head: () =>
    pageHead({
      path: "/courses",
      title: m.course_catalogue_meta_title(),
      description: m.course_catalogue_meta_description(),
    }),
  component: CourseCataloguePage,
  errorComponent: CatalogueError,
});

/*===== Catalogue View =====*/
/**
 * What the page shows for a URL: the matching courses of one page, and the shelf's tabs. Behavior-modification courses
 * never reach the list (`isShownFamily`).
 */
function catalogueView({ courses, search }: { courses: Course[]; search: CatalogueSearch }) {
  const query = (search.q ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  /*------ Family ------*/
  // A family with no course has no tab, so a link to it falls back to showing everything rather than an empty list.
  const tabs = familiesWithCourses(courses);
  const family = tabs.some((tab) => tab.family === search.family) ? (search.family ?? null) : null;
  const familyLabel = FAMILY_TABS.find((tab) => tab.family === family)?.label ?? null;

  /*------ Filter ------*/
  const matching = courses.filter(
    (course) =>
      isShownFamily(course.family) && (family === null || course.family === family) && matchesQuery({ course, query }),
  );

  /*------ Page ------*/
  // A page past the end (an old link, or a search that got narrower) shows the last one.
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const page = Math.min(Math.max(search.page ?? 1, 1), pageCount);

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
function CourseCataloguePage() {
  const search = Route.useSearch();
  const { data: catalogue } = useSuspenseQuery(orpc.course.list.queryOptions());
  const { courses, tabs, total, query, family, familyLabel, page, pageCount } = catalogueView({
    courses: catalogue,
    search,
  });

  /*------ URL State ------*/
  // The family and the page are set here; the search (`q`) is set by the header's search bar. Changing the family
  // always sends the visitor back to the first page. Filter changes replace the history entry and keep the scroll.
  const navigate = useNavigate({ from: Route.fullPath });

  /*------ Pending ------*/
  // Only a change to this page's own URL dims the list; leaving for a course page shouldn't flash it.
  const pending = useRouterState({
    select: (state) => state.status === "pending" && state.location.pathname === state.resolvedLocation?.pathname,
  });

  /*------ Arrival ------*/
  // A new list (another family, search or page) fades in rather than snapping in. It is keyed by the resolved list, not
  // the raw URL, so an out-of-range page or an unknown family doesn't replay it. The first list the page opened with is
  // already there, so it doesn't play (state adjusted during render, React's pattern for it).
  const listKey = `${family ?? "all"}|${query}|${page}`;
  const [arrival, setArrival] = useState({ key: listKey, changed: false });
  if (arrival.key !== listKey) setArrival({ key: listKey, changed: true });

  return (
    <>
      {/*===== Header and the Dog =====*/}
      {/* The search itself is in the site header (`HeaderSearch`), which writes the same `q`. */}
      <CatalogueHeader total={total} query={query} familyLabel={familyLabel} />

      {/*===== The Shelf =====*/}
      <FamilyShelf
        tabs={tabs}
        value={search.family ?? "all"}
        onChange={(next) =>
          void navigate({
            search: (prev) => ({ ...prev, family: isCatalogueFamily(next) ? next : undefined, page: undefined }),
            replace: true,
            resetScroll: false,
          })
        }
      />

      {/*===== Results =====*/}
      <div
        id="results"
        aria-busy={pending}
        className={cn(
          CATALOGUE_COLUMN,
          "scroll-mt-24 pt-8 transition-opacity duration-200 sm:pt-10",
          pending && "opacity-60",
        )}
      >
        {total === 0 ? (
          <div key={listKey} className={cn(arrival.changed && "answer-in")}>
            <NoResults />
          </div>
        ) : (
          <ResultsGrid
            key={listKey}
            arrive={arrival.changed}
            courses={courses}
            page={page}
            pageCount={pageCount}
            // Paging is the one change the Back button should undo.
            onPageChange={(next) =>
              void navigate({
                search: (prev) => ({ ...prev, page: next === 1 ? undefined : next }),
                resetScroll: false,
              })
            }
          />
        )}
      </div>

      {/*===== The Ask =====*/}
      <div className={`${CATALOGUE_COLUMN} py-section-sm`}>
        <EvaluationAsk />
      </div>
    </>
  );
}

/*===== Error Boundary =====*/
// Renders inside the public layout, so a failed list still has the header and footer. The retry is a full page load of
// the same URL: the server renders the page again and nothing half-hydrated is left behind.
function CatalogueError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="catalogue-error-title" className={`${CATALOGUE_COLUMN} py-section-md`}>
      <div className="max-w-xl">
        <h1 id="catalogue-error-title" className={`${DISPLAY_HEADING} text-h1 text-balance`}>
          {m.course_catalogue_error_title()}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">{m.course_catalogue_error_text()}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {m.course_catalogue_error_retry()}
          </a>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.course_catalogue_error_evaluation()}
          </Link>
        </div>
      </div>
    </section>
  );
}
