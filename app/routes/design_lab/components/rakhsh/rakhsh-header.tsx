import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR } from "~/lib/contact";
import { EvaluationButton } from "~/routes/design_lab/components/rakhsh/rakhsh-cta";
import { LAB_LINKS } from "~/routes/design_lab/lab-content";

const NAV = [
  { label: "دوره‌ها", to: LAB_LINKS.courses },
  { label: "درباره", to: LAB_LINKS.about },
  { label: "تماس", to: LAB_LINKS.contact },
  { label: "راهنما", to: LAB_LINKS.help },
] as const;

/*===== Header =====*/
export function RakhshHeader() {
  const [open, setOpen] = useState(false);
  const linkClass =
    "rounded px-1 py-1 text-sm text-[var(--rk-bone)]/85 hover:text-[var(--rk-sand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rk-sand)]";

  return (
    <header className="relative z-20 border-b border-[var(--rk-sand)]/20 bg-[var(--rk-olive-deep)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
        {/*------ Wordmark ------*/}
        <Link
          to="/"
          className="flex flex-col leading-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rk-sand)]"
        >
          <span className="font-display text-2xl font-black text-[var(--rk-bone)]">زروان</span>
          <span className="hidden text-[11px] text-[var(--rk-sand)] sm:block">{CENTER_DESCRIPTOR}</span>
        </Link>

        {/*------ Desktop nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to={LAB_LINKS.auth} className={`${linkClass} hidden sm:block`}>
            ورود
          </Link>
          <EvaluationButton className="px-4 py-2 text-sm" />
          <button
            type="button"
            aria-expanded={open}
            aria-controls="rk-mobile-nav"
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            onClick={() => setOpen((value) => !value)}
            className="rounded p-2 text-[var(--rk-bone)] focus-visible:outline-2 focus-visible:outline-[var(--rk-sand)] md:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {/*------ Mobile disclosure ------*/}
      {open && (
        <nav
          id="rk-mobile-nav"
          aria-label="منوی موبایل"
          className="flex flex-col gap-1 border-t border-[var(--rk-sand)]/20 px-4 pb-4 md:hidden"
        >
          {[...NAV, { label: "ورود", to: LAB_LINKS.auth }].map((item) => (
            <Link key={item.to} to={item.to} className={`${linkClass} py-2 text-base`}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
