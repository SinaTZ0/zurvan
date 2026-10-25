import { useNavigate } from "@tanstack/react-router";
import { cn } from "cn";
import { SearchIcon, XIcon } from "lucide-react";
import { useRef } from "react";

import { blogCategoryLabel } from "~/components/blog/category-label";
import { BLOG_COLUMN } from "~/components/blog/column";
import { Link } from "~/components/link";
import { useSearchText } from "~/hooks/use-search-text";
import { BRICK } from "~/lib/brick";
import { localizedPath } from "~/lib/i18n";
import { BLOG_CATEGORIES, BLOG_QUERY_MAX_LENGTH, type BlogCategory } from "~/orpc/blog/constants";
import { m } from "~/paraglide/messages";

/*===== Pill =====*/
const PILL =
  "flex h-10 shrink-0 items-center rounded-full border px-5 text-sm font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/*===== Blog Shelf =====*/
/**
 * The wall the reading dog lies on: a brick band with a light coping, holding the sections and the search. The sections
 * are links (crawlable, and they work before the page wakes up), the chosen one gold; on phones they scroll sideways
 * and the search sits under them. From tablets the band sticks to the screen's top while the posts scroll under it,
 * like a shop app's category bar; on phones it scrolls away, so the posts keep the small screen.
 */
export function BlogShelf({ category, q }: { category: BlogCategory | undefined; q: string | undefined }) {
  return (
    <div
      style={{ backgroundImage: `var(--grain), ${BRICK}` }}
      className="relative z-30 border-t-2 border-b border-t-foreground/60 border-b-border bg-inverse md:sticky md:top-0"
    >
      <div
        className={cn(
          BLOG_COLUMN,
          "flex flex-col gap-2.5 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:py-4",
        )}
      >
        {/*------ Sections ------*/}
        <nav aria-label={m.blog_index_filter_label()} className="min-w-0">
          {/* A little padding all round so the pills' focus rings aren't cut by the scroller's edges. */}
          <ul className="-mx-1 flex [scrollbar-width:none] gap-2 overflow-x-auto p-1">
            {[undefined, ...BLOG_CATEGORIES].map((value) => {
              const active = value === category;
              return (
                <li key={value ?? "all"}>
                  <Link
                    to="/blog"
                    search={(prev) => ({ ...prev, category: value })}
                    replace
                    resetScroll={false}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      PILL,
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {value ? blogCategoryLabel(value) : m.blog_index_filter_all()}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/*------ Search ------*/}
        <SearchField category={category} q={q} />
      </div>
    </div>
  );
}

/*===== Search Field =====*/
/**
 * The posts' own search (the header's magnifier searches the courses). It follows the visitor's typing and writes `q`
 * to the URL once typing pauses (a `replace`, so the history doesn't fill up); Enter commits at once; × clears it and
 * keeps the focus in the field. Before the page wakes up it is a plain GET form to the blog, keeping the section.
 */
function SearchField({ category, q }: { category: BlogCategory | undefined; q: string | undefined }) {
  const navigate = useNavigate({ from: "/blog" });
  const inputRef = useRef<HTMLInputElement>(null);
  const search = useSearchText({
    urlText: q ?? "",
    delayMs: 350,
    commit: (text) =>
      void navigate({
        search: (prev) => ({ ...prev, q: text.trim() === "" ? undefined : text.trim() }),
        replace: true,
        resetScroll: false,
      }),
  });
  const filled = search.text !== "";

  return (
    <search className="w-full md:w-72 lg:w-80">
      <form
        action={localizedPath({ path: "/blog" })}
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          search.set(search.text);
        }}
        className="relative"
      >
        <label htmlFor="blog-search" className="sr-only">
          {m.blog_index_search_label()}
        </label>
        {category && <input type="hidden" name="category" value={category} />}
        <SearchIcon
          aria-hidden
          strokeWidth={2}
          className="pointer-events-none absolute start-4 top-1/2 size-[1.125rem] -translate-y-1/2 text-primary"
        />
        <input
          ref={inputRef}
          id="blog-search"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={BLOG_QUERY_MAX_LENGTH}
          placeholder={m.blog_index_search_placeholder()}
          value={search.text}
          onChange={(event) => search.change(event.target.value)}
          className="h-11 w-full rounded-full border border-border bg-jet ps-11 pe-12 text-sm text-foreground shadow-sm transition-colors outline-none placeholder:text-muted-foreground hover:border-foreground/30 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
        {/* Always in the DOM, so it can shrink away instead of vanishing; out of the tab order while there is nothing to
          clear. */}
        <button
          type="button"
          aria-label={m.blog_index_search_clear()}
          tabIndex={filled ? 0 : -1}
          aria-hidden={!filled}
          onClick={() => {
            search.set("");
            inputRef.current?.focus();
          }}
          className={cn(
            "absolute end-0.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition duration-200 outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
            filled ? "scale-100 rotate-0 opacity-100" : "pointer-events-none scale-50 rotate-90 opacity-0",
          )}
        >
          <XIcon aria-hidden strokeWidth={2.2} className="size-4" />
        </button>
      </form>
    </search>
  );
}
