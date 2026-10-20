import { cn } from "cn";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR } from "~/lib/contact";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

/*===== Constants =====*/
const NAV = [
  { label: "دوره‌ها", to: LAB_LINKS.courses },
  { label: "درباره", to: LAB_LINKS.about },
  { label: "تماس", to: LAB_LINKS.contact },
  { label: "راهنما", to: LAB_LINKS.help },
] as const;

const FOCUS = "outline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--fd-ink)] rounded-md";

/*===== Fandogh Header =====*/
/** Wordmark, nav, login and the free-evaluation button. Phones keep the button and fold the links into a disclosure. */
export function FandoghHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 bg-[var(--fd-sky)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/*------ Wordmark ------*/}
        <Link to="/" className={cn("flex flex-col leading-none", FOCUS)}>
          <span className="font-['Lalezar'] text-3xl text-[var(--fd-ink)]">زروان</span>
          <span className="mt-1 hidden text-[11px] font-medium text-[var(--fd-ink)]/80 sm:block">
            {CENTER_DESCRIPTOR}
          </span>
        </Link>

        {/*------ Desktop nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn("text-[15px] font-semibold text-[var(--fd-ink)] hover:underline", FOCUS)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/*------ Actions ------*/}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to={LAB_LINKS.auth}
            className={cn("hidden text-[15px] font-semibold text-[var(--fd-ink)] hover:underline sm:block", FOCUS)}
          >
            ورود
          </Link>
          <Link
            to={LAB_LINKS.evaluation}
            className="rounded-full bg-[var(--fd-leaf-deep)] px-5 py-2.5 text-sm font-bold text-white outline-offset-4 transition-colors hover:bg-[var(--fd-ink)] focus-visible:outline-2 focus-visible:outline-[var(--fd-ink)]"
          >
            ارزیابی رایگان
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="fd-mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            onClick={() => setOpen((value) => !value)}
            className={cn("grid size-10 place-items-center rounded-full bg-white/70 md:hidden", FOCUS)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/*------ Mobile disclosure ------*/}
      {open && (
        <nav
          id="fd-mobile-nav"
          aria-label="منوی موبایل"
          className="mx-4 mb-3 grid gap-1 rounded-2xl bg-white p-3 md:hidden"
        >
          {[...NAV, { label: "ورود", to: LAB_LINKS.auth }].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn("px-3 py-2.5 text-base font-semibold text-[var(--fd-ink)]", FOCUS)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
