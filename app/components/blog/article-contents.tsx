import { cn } from "cn";
import { ChevronDownIcon } from "lucide-react";
import { useId, useState } from "react";

import { MascotCut } from "~/components/mascot-cut";
import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

type Heading = { id: string; text: string };

/*===== Contents Link =====*/
// Plain `#section-n` links: the smooth scroller glides to them, and in the Admin's preview the article's click guard
// scrolls inside the preview instead.
function ContentsLinks({ headings, onPick }: { headings: Heading[]; onPick?: () => void }) {
  return (
    <ol className="flex flex-col gap-0.5">
      {headings.map((heading, index) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            onClick={onPick}
            className="flex items-start gap-2.5 rounded-xl px-1 py-2 text-[0.95rem] leading-7 font-bold text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span
              aria-hidden
              className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-primary/60 font-display text-xs font-extrabold text-primary"
            >
              {formatNumber(index + 1)}
            </span>
            <span dir="auto" className="min-w-0 text-pretty">
              {heading.text}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

/*===== Rail Contents =====*/
/**
 * The contents plate of the wide rail: the post's sections in order, each a numbered link, with the dog lying along
 * the plate's top edge reading the post (a bush either side). He lies at the plate's start corner looking along it:
 * his picture faces right, so it is mirrored on the Persian pages, where the start is the right. A long list scrolls inside the plate
 * so the sticky plate never runs past the screen.
 */
export function RailContents({ headings }: { headings: Heading[] }) {
  return (
    <nav aria-labelledby="post-contents-title" className="relative mt-24">
      {/*------ Dog Reading on the Plate's Edge ------*/}
      <div aria-hidden className="pointer-events-none absolute start-6 bottom-[calc(100%-0.25rem)] z-10 w-40">
        <div className="absolute -inset-x-1/4 -top-1/4 bottom-0 bg-[radial-gradient(ellipse_45%_55%_at_50%_60%,rgb(255_194_26/0.08),transparent)]" />
        <MascotCut name="plants" className="lively-sway absolute end-[90%] bottom-0 w-[28%] translate-y-[4%]" />
        <MascotCut
          name="plants"
          className="lively-sway-2 absolute start-[94%] bottom-0 w-[24%] translate-y-[4%] -scale-x-100"
        />
        <MascotCut name="read" className="lively-breathe relative block w-full translate-y-[5%] rtl:-scale-x-100" />
      </div>

      <div className="rounded-3xl border border-border bg-card paper-grain px-5 py-5 shadow-sm">
        <h2 id="post-contents-title" className="font-display text-lg font-extrabold">
          {m.blog_article_contents_title()}
        </h2>
        <div
          data-lenis-prevent
          className="mt-3 max-h-[calc(100svh-22rem)] overflow-y-auto border-s border-foreground/15 ps-3"
        >
          <ContentsLinks headings={headings} />
        </div>
      </div>
    </nav>
  );
}

/*===== Phone Contents =====*/
/**
 * The same list on phones, folded under the cover so the text starts on the first screens: «توی این نوشته» opens it
 * as one motion (the rows grow from nothing as the list lifts and fades in) and picking a section folds it again. The
 * list stays mounted and `inert` while folded, so it is never tabbed into unseen.
 */
export function PhoneContents({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <nav
      aria-labelledby={`${panelId}-title`}
      className="rounded-3xl border border-border bg-card paper-grain lg:hidden"
    >
      <h2 id={`${panelId}-title`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-12 w-full items-center justify-between gap-3 rounded-3xl px-5 py-3 text-start font-display text-base font-extrabold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span>{m.blog_article_contents_title()}</span>
          <span className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
            {formatNumber(headings.length)}
            <ChevronDownIcon
              aria-hidden
              strokeWidth={2}
              className={cn("size-5 text-primary transition-transform duration-300", open && "rotate-180")}
            />
          </span>
        </button>
      </h2>
      <div
        id={panelId}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-foreground/10 px-4 pt-2 pb-3 transition duration-300 motion-reduce:transition-none",
              open ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
            )}
          >
            <ContentsLinks headings={headings} onPick={() => setOpen(false)} />
          </div>
        </div>
      </div>
    </nav>
  );
}
