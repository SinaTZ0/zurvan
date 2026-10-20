import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR } from "~/lib/contact";
import { EvaluationButton } from "~/routes/design_lab/components/story/story-parts";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

const NAV = [
  { label: "دوره‌ها", to: LAB_LINKS.courses },
  { label: "درباره", to: LAB_LINKS.about },
  { label: "تماس", to: LAB_LINKS.contact },
  { label: "راهنما", to: LAB_LINKS.help },
] as const;

const LINK =
  "rounded px-1 py-1 text-[15px] text-(--st-ink)/85 hover:text-(--st-ink) hover:underline underline-offset-8 decoration-(--st-mustard) decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)";

/*===== Header =====*/
/**
 * `onToggleTheme` flips day and night; the icon shows the theme it switches to, by CSS, so it is right before
 * hydration. Without it (the night-only page) there is no switch.
 */
export function StoryHeader({ onToggleTheme }: { onToggleTheme?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 mx-auto max-w-6xl px-4 pt-3 md:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-(--st-line)/25 pb-3">
        {/*------ Wordmark ------*/}
        <Link
          to="/"
          className="flex flex-col leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--st-ink)"
        >
          <span className="font-display text-3xl font-black text-(--st-ink)">زروان</span>
          <span className="hidden text-[11px] text-(--st-ink)/70 sm:block">{CENTER_DESCRIPTOR}</span>
        </Link>

        {/*------ Desktop nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={LINK}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="تغییر حالت روز و شب"
              title="روز / شب"
              className="grid size-9 place-items-center rounded-full border border-(--st-line)/25 text-(--st-ink) hover:bg-(--st-ink)/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)"
            >
              <Moon aria-hidden className="st-day size-[1.1rem]" strokeWidth={1.8} />
              <Sun aria-hidden className="st-night size-[1.1rem]" strokeWidth={1.8} />
            </button>
          )}
          <Link to={LAB_LINKS.auth} className={`${LINK} hidden sm:block`}>
            ورود
          </Link>
          <EvaluationButton className="px-4 py-2 text-sm sm:px-5">ارزیابی رایگان</EvaluationButton>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="st-mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            onClick={() => setOpen((value) => !value)}
            className="rounded p-2 text-(--st-ink) focus-visible:outline-2 focus-visible:outline-(--st-ink) lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {/*------ Mobile disclosure ------*/}
      {open && (
        <nav
          id="st-mobile-nav"
          aria-label="منوی موبایل"
          className="absolute inset-x-4 top-full z-40 flex flex-col rounded-2xl border-2 border-(--st-line) bg-(--st-paper) p-3 lg:hidden"
        >
          {[...NAV, { label: "ورود", to: LAB_LINKS.auth }].map((item) => (
            <Link key={item.to} to={item.to} className={`${LINK} py-2.5 text-base`}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
