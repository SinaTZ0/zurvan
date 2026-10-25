import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useLocation, useRouterState } from "@tanstack/react-router";
import { cn } from "cn";
import { useState } from "react";

import { blogCategoryLabel } from "~/components/blog/category-label";
import { BLOG_COLUMN } from "~/components/blog/column";
import { buttonVariants } from "~/components/ui/button";
import { Link } from "~/components/link";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumber } from "~/lib/locale-format";
import { pageHead } from "~/lib/seo";
import { m } from "~/paraglide/messages";
import { BlogHeader } from "~/routes/blog_index/components/blog-header";
import { BlogShelf } from "~/routes/blog_index/components/blog-shelf";
import { EmptyState, type EmptyKind } from "~/routes/blog_index/components/empty-state";
import { PostGrid } from "~/routes/blog_index/components/post-grid";
import { WithQuery } from "~/routes/blog_index/components/with-query";
import { postsQuery } from "~/routes/blog_index/queries";
import { blogSearchSchema, cleanQuery } from "~/routes/blog_index/search-params";

/*===== Route =====*/
// Public. The URL (`category`, `q`) is the whole state, so a filtered list can be shared and renders the same on the
// server. The API filters and searches (it folds Persian spellings), so both are loader deps: a change asks the server
// again. The list has no pages yet: the API returns every match (app-spec F16).
export const Route = createFileRoute("/_public/blog")({
  validateSearch: blogSearchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, q: cleanQuery(search.q) }),
  loader: ({ context: { queryClient }, deps }) => queryClient.ensureQueryData(postsQuery(deps)),
  head: () =>
    pageHead({
      path: "/blog",
      title: m.blog_index_meta_title(),
      description: m.blog_index_meta_description(),
    }),
  component: BlogIndexPage,
  errorComponent: BlogIndexError,
});

/*===== List Key =====*/
/** What decides the list: the section and the cleaned search. Any search object of this page's URL. */
function listKeyOf(search: unknown): string {
  const { category, q } = (search ?? {}) as { category?: unknown; q?: unknown };
  return `${typeof category === "string" ? category : "all"}|${cleanQuery(q === undefined ? undefined : String(q)) ?? ""}`;
}

/*===== Page =====*/
function BlogIndexPage() {
  const search = Route.useSearch();
  const category = search.category;
  const q = cleanQuery(search.q);
  const { data: posts } = useSuspenseQuery(postsQuery({ category, q }));

  /*------ Pending ------*/
  // Only a change of this page's list dims it: leaving for a post shouldn't flash it, and neither should the router
  // rewriting the address it was opened with (`?q=a%20b` becomes `?q=a+b` right after hydration, a navigation that
  // changes nothing; dimming then would also differ from the server's HTML).
  const pending = useRouterState({
    select: (state) =>
      state.status === "pending" &&
      state.location.pathname === state.resolvedLocation?.pathname &&
      listKeyOf(state.location.search) !== listKeyOf(state.resolvedLocation.search),
  });

  /*------ Arrival ------*/
  // A new list (another section or search) rises in rather than snapping in. The first list the page opened with is
  // already there, so it doesn't play (state adjusted during render, React's pattern for it).
  const listKey = listKeyOf(search);
  const [arrival, setArrival] = useState({ key: listKey, changed: false });
  if (arrival.key !== listKey) setArrival({ key: listKey, changed: true });

  /*------ Empty ------*/
  // Truthful about why: a search wins over a section (clearing it is the way out), and a section over "nothing yet".
  const empty: EmptyKind | null =
    posts.length > 0
      ? null
      : q
        ? { kind: "query", query: q }
        : category
          ? { kind: "category", label: blogCategoryLabel(category) }
          : { kind: "none" };

  return (
    <>
      <BlogHeader />
      <BlogShelf category={category} q={q} />

      {/*===== Posts =====*/}
      <div
        id="posts"
        aria-busy={pending}
        className={cn(
          BLOG_COLUMN,
          "scroll-mt-24 pt-6 transition-opacity duration-200 md:pt-10",
          pending && "opacity-60",
        )}
      >
        {/*------ Result Line ------*/}
        {/* Said aloud whenever a filtered list arrives; drawn only for a filtered list that has posts (the empty
            plate says it itself). */}
        <output aria-live="polite" className="block">
          {empty === null && (category || q) && (
            <span key={listKey} className="answer-in mb-4 block text-sm font-bold text-muted-foreground md:mb-6">
              <ResultLine count={posts.length} category={category ? blogCategoryLabel(category) : null} query={q} />
            </span>
          )}
        </output>

        {empty ? (
          <div key={listKey}>
            <EmptyState empty={empty} />
          </div>
        ) : (
          <PostGrid key={listKey} posts={posts} arrive={arrival.changed} />
        )}
      </div>
    </>
  );
}

/*===== Result Line =====*/
function ResultLine({ count, category, query }: { count: number; category: string | null; query: string | undefined }) {
  const number = formatNumber(count);
  if (query) {
    return (
      <WithQuery
        text={(mark) =>
          count === 1
            ? m.blog_index_count_query_one({ count: number, query: mark })
            : m.blog_index_count_query_other({ count: number, query: mark })
        }
        query={query}
      />
    );
  }
  return (
    <>
      {count === 1
        ? m.blog_index_count_category_one({ count: number, category: category ?? "" })
        : m.blog_index_count_category_other({ count: number, category: category ?? "" })}
    </>
  );
}

/*===== Error Boundary =====*/
// Inside the public layout, so a failed list still has the header and footer. The retry is a full page load of the same
// URL: the server renders the page again and nothing half-hydrated is left behind.
function BlogIndexError() {
  const href = useLocation({ select: (location) => location.href });

  return (
    <section aria-labelledby="blog-error-title" className={cn(BLOG_COLUMN, "py-section-md")}>
      <div className="max-w-xl">
        <h1 id="blog-error-title" className={cn(DISPLAY_HEADING, "text-h1 text-balance")}>
          {m.blog_index_error_title()}
        </h1>
        <p className="mt-4 text-lead text-pretty text-muted-foreground">{m.blog_index_error_text()}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href={href} className={buttonVariants({ variant: "solid", size: "lg" })}>
            {m.blog_index_error_retry()}
          </a>
          <Link to="/assessment" className={buttonVariants({ variant: "outline", size: "lg" })}>
            {m.shared_evaluation_request()}
          </Link>
        </div>
      </div>
    </section>
  );
}
