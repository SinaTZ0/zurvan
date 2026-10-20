import { SearchIcon, XIcon } from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Form, useLocation, useNavigate } from "react-router";

import { cn } from "cn";

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "~/components/ui/input-group";
import {
  CATALOGUE_PATH,
  catalogueSearchParams,
  MAX_QUERY_LENGTH,
  TYPING_DELAY_MS,
} from "~/lib/catalogue-search-params";

const PANEL_ID = "header-search";
const TOGGLE_ID = "header-search-toggle";
const INPUT_ID = "header-search-input";

/*===== Header Search =====*/
/**
 * The course search, in the header on every public page: a magnifier that opens a search bar under the header's
 * hairline. It searches the course catalogue, so it behaves by where the visitor is:
 * - On `/courses` the field *is* the URL's `q`: typing filters the list as before (debounced, back to the first page),
 *   Enter applies it at once, and a page loaded with a search opens with the bar showing it, so it can be read and
 *   cleared. Closing the bar there also drops the search, so a hidden filter never lingers on the list.
 * - Anywhere else the words are only kept here, and Enter goes to `/courses?q=…`.
 *
 * The bar is a real GET form to `/courses`, so a search typed before hydration still works; only opening it needs
 * JavaScript, and a search page loaded from the server renders it open. Closing keeps the words outside the
 * catalogue, so they don't vanish while the bar slides shut, and the bar opens again on them.
 *
 * The header calls this once and places the two halves: the toggle in its row of controls, the bar under the row.
 */
export function useHeaderSearch() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const onCatalogue = pathname === CATALOGUE_PATH;

  /*------ State ------*/
  // Opening is remembered per page, so moving to another page closes the bar without an effect. On the catalogue a
  // search in the URL keeps it open.
  const [params, setParams] = useQueryStates(catalogueSearchParams);
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const open = openedOn === pathname || (onCatalogue && params.q !== "");
  const value = onCatalogue ? params.q : draft;

  /*------ Actions ------*/
  function close() {
    setOpenedOn(null);
    if (onCatalogue && params.q !== "") void setParams({ q: null, page: null });
    document.getElementById(TOGGLE_ID)?.focus();
  }

  function change(next: string) {
    // Emptying the field on the catalogue drops `q`, which alone would close a bar the page opened for a search.
    setOpenedOn(pathname);
    if (onCatalogue) void setParams({ q: next || null, page: null }, { limitUrlUpdates: debounce(TYPING_DELAY_MS) });
    else setDraft(next);
  }

  function toggle() {
    if (open) return close();
    // The bar mounts in this same update, so the field can take focus straight after: the visitor asked for it.
    flushSync(() => setOpenedOn(pathname));
    document.getElementById(INPUT_ID)?.focus();
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    // Once hydrated the URL is written here; before that, the browser's own GET does the job.
    event.preventDefault();
    const query = value.trim();
    if (onCatalogue) {
      void setParams({ q: query || null, page: null });
      return;
    }
    setDraft("");
    void navigate(query ? `${CATALOGUE_PATH}?q=${encodeURIComponent(query)}` : CATALOGUE_PATH);
  }

  return {
    open,
    value,
    family: onCatalogue ? params.family : null,
    toggle,
    close,
    change,
    submit,
  };
}

export type HeaderSearchState = ReturnType<typeof useHeaderSearch>;

/*===== Toggle =====*/
const ICON =
  "col-start-1 row-start-1 size-5 transition-[rotate,scale,opacity] duration-300 ease-[cubic-bezier(0.3,1.3,0.5,1)] motion-reduce:transition-none";

/** The magnifier in the header's row; a cross while the bar is open. */
export function HeaderSearchToggle({ search, className }: { search: HeaderSearchState; className?: string }) {
  return (
    <button
      id={TOGGLE_ID}
      type="button"
      aria-expanded={search.open}
      aria-controls={PANEL_ID}
      aria-label={search.open ? "بستن جست‌وجو" : "جست‌وجوی دوره‌ها"}
      onClick={search.toggle}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-full border text-foreground transition-[background-color,border-color,scale] duration-200 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground active:scale-90",
        search.open ? "border-foreground/60 bg-accent" : "border-foreground/25",
        className,
      )}
    >
      {/* Both icons share the one cell and turn into each other: the magnifier spins away as the cross spins in. */}
      <SearchIcon aria-hidden strokeWidth={1.8} className={cn(ICON, search.open && "scale-50 -rotate-90 opacity-0")} />
      <XIcon aria-hidden strokeWidth={1.8} className={cn(ICON, !search.open && "scale-50 rotate-90 opacity-0")} />
    </button>
  );
}

/*===== Bar =====*/
/**
 * The search field under the header's hairline: full width on phones, at the end side from `lg`.
 *
 * It stays mounted and slides: closed, its row collapses to no height (grid rows 0fr) and the field lifts and fades,
 * so opening and closing are one motion rather than a jump. Closed it is also `inert`, out of the tab order and the
 * accessibility tree. The toggle's `flushSync` lifts `inert` before it moves focus in.
 */
export function HeaderSearchBar({ search }: { search: HeaderSearchState }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <search
      id={PANEL_ID}
      inert={!search.open}
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
        search.open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      {/* The padding sits inside the clipped row, so it collapses too; the inline padding keeps the focus ring whole. */}
      <div className="-mx-1 min-h-0 overflow-hidden px-1">
        <Form
          method="get"
          action={CATALOGUE_PATH}
          onSubmit={search.submit}
          className={cn(
            "pt-3 pb-1 transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none lg:ms-auto lg:max-w-xl",
            !search.open && "-translate-y-2 opacity-0",
          )}
        >
          <label htmlFor={INPUT_ID} className="sr-only">
            جست‌وجوی دوره
          </label>
          <InputGroup className="h-12 rounded-full">
            <InputGroupAddon>
              <SearchIcon strokeWidth={1.7} aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              id={INPUT_ID}
              name="q"
              type="search"
              value={search.value}
              maxLength={MAX_QUERY_LENGTH}
              autoComplete="off"
              enterKeyHint="search"
              placeholder="مثلاً سگ همدم، CGC یا IGP"
              onChange={(event) => search.change(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") search.close();
              }}
              // Our own clear button replaces the browser's cross.
              className="[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-cancel-button]:appearance-none"
            />
            {search.value !== "" && (
              <InputGroupAddon align="inline-end" className="answer-pop">
                <InputGroupButton
                  aria-label="پاک کردن جست‌وجو"
                  size="icon-sm"
                  className="rounded-full"
                  onClick={() => {
                    search.change("");
                    inputRef.current?.focus();
                  }}
                >
                  <XIcon aria-hidden />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          {/* The family stays when searching on the catalogue; this carries it for the no-JavaScript submit. */}
          {search.family && <input type="hidden" name="family" value={search.family} />}
        </Form>
      </div>
    </search>
  );
}
