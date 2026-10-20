import { CENTER_DESCRIPTOR } from "~/lib/contact";
import { Link } from "~/components/link";

import { FOCUS_RING, POSTER_FONT } from "./saye-parts";

/*===== Header =====*/
// Sits on the hero's fawn field in black ink, so the page opens like one sheet. The nav collapses into a `<details>`
// on phones (no JS needed); the evaluation button stays visible at every width.

const NAV = [
  { label: "دوره‌ها", to: "/courses" },
  { label: "درباره", to: "/about" },
  { label: "تماس", to: "/contact" },
  { label: "راهنما", to: "/help" },
] as const;

export function SayeHeader() {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12 lg:py-6">
      {/*------ Wordmark ------*/}
      <Link to="/" className={`flex flex-col leading-none ${FOCUS_RING}`}>
        <span className={`${POSTER_FONT} text-4xl sm:text-5xl`}>زروان</span>
        <span className="mt-1 hidden text-[11px] font-bold sm:block">{CENTER_DESCRIPTOR}</span>
      </Link>

      {/*------ Desktop nav ------*/}
      <nav aria-label="ناوبری اصلی" className="hidden items-center gap-8 text-base font-bold lg:flex">
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} className={`underline-offset-8 hover:underline ${FOCUS_RING}`}>
            {item.label}
          </Link>
        ))}
        <Link to="/auth" className={`underline-offset-8 hover:underline ${FOCUS_RING}`}>
          ورود
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link
          to="/assessment"
          className={`bg-black px-4 py-2.5 text-sm font-bold text-[var(--sy-fawn)] hover:bg-[var(--sy-red)] hover:text-[var(--sy-paper)] sm:px-6 sm:text-base ${FOCUS_RING}`}
        >
          ارزیابی رایگان
        </Link>

        {/*------ Mobile menu ------*/}
        <details className="group relative lg:hidden">
          <summary
            className={`flex h-11 cursor-pointer list-none items-center border-2 border-black px-3 text-sm font-bold [&::-webkit-details-marker]:hidden ${FOCUS_RING}`}
          >
            منو
          </summary>
          <div className="absolute end-0 top-full z-30 mt-2 flex w-44 flex-col bg-black p-2 text-[var(--sy-paper)]">
            {[...NAV, { label: "ورود", to: "/auth" }].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-3 text-base font-bold hover:bg-[var(--sy-fawn)] hover:text-black ${FOCUS_RING}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
