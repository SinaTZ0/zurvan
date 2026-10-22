import { useLenis } from "lenis/react";
import { BookOpen, ClipboardCheck, Ellipsis, House, Phone } from "lucide-react";
import { useState } from "react";
import { useLocation } from "@tanstack/react-router";

import { cn } from "cn";

import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";
import { TAB_BAR_DOCK_ID } from "~/lib/tab-bar-dock";
import { MoreSheet } from "~/routes/layout_public/components/more-sheet";
import { NAV_CTA } from "~/routes/layout_public/nav-items";
import type { Viewer } from "~/routes/layout_public/viewer";
import { m } from "~/paraglide/messages";

/*===== Tab Bar =====*/
// A floating bar held off the screen's edges, as on a phone app. The evaluation is the gold tile in the middle, the
// one action every page leads to; it sits flush in the bar rather than raised over it, which read as an ad. The bar
// is the card's grey with a hairline of ink, so the gold tile is the only bright thing on it. Its height (4.25rem +
// the 0.75rem gap) is what the footer leaves free at the bottom (`--tab-bar-space`, app.css), so it never covers the
// page's last words.
const TAB =
  "group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] leading-none text-foreground/70 transition-colors hover:text-foreground aria-[current=page]:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ICON = "size-[1.375rem] group-aria-[current=page]:text-primary";

/** The phone's tab bar, below `lg`: home, courses, the evaluation, contact and a sheet with the rest. */
export function TabBar({ viewer }: { viewer: Viewer | null }) {
  const lenis = useLenis();
  const pathname = useLocation({ select: (location) => location.pathname });
  const [more, setMore] = useState(false);

  /*------ Home: on the home page the tab takes the visitor back to its top ------*/
  function toTop() {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="group/dock fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md [view-transition-name:tab-dock] lg:hidden">
        {/*------ Dock ------*/}
        {/* A page can dock its own strip on top of the bar (Course Detail's buy bar), portalled into this element by
            its id. While the strip is open it carries `data-dock-open`, and the bar squares its top corners so the two
            read as one object. The strip sits outside the nav: it isn't part of the site's menu. */}
        <div id={TAB_BAR_DOCK_ID} />

        <nav aria-label={m.layout_public_main_menu()}>
          <ul className="flex h-[4.25rem] items-stretch rounded-[1.6rem] border border-foreground/15 bg-card/90 px-1.5 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md transition-[border-radius] group-has-[[data-dock-open]]/dock:rounded-t-none">
            <li className="flex flex-1">
              {pathname === "/" ? (
                <button type="button" aria-current="page" onClick={toTop} className={TAB}>
                  <House aria-hidden className={ICON} strokeWidth={1.8} />
                  {m.layout_public_tab_home()}
                </button>
              ) : (
                <Link to="/" className={TAB}>
                  <House aria-hidden className={ICON} strokeWidth={1.8} />
                  {m.layout_public_tab_home()}
                </Link>
              )}
            </li>
            <li className="flex flex-1">
              <NavLink to="/courses" className={TAB}>
                <BookOpen aria-hidden className={ICON} strokeWidth={1.8} />
                {m.layout_public_tab_courses()}
              </NavLink>
            </li>

            {/*------ The action ------*/}
            <li className="flex flex-1 py-2">
              <NavLink
                to={NAV_CTA.to}
                className={cn(
                  TAB,
                  "bg-primary font-bold text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground aria-[current=page]:text-primary-foreground",
                )}
              >
                <ClipboardCheck aria-hidden className="size-[1.375rem]" strokeWidth={2} />
                {m.layout_public_tab_evaluation()}
              </NavLink>
            </li>

            <li className="flex flex-1">
              <NavLink to="/contact" className={TAB}>
                <Phone aria-hidden className={ICON} strokeWidth={1.8} />
                {m.layout_public_tab_contact()}
              </NavLink>
            </li>
            <li className="flex flex-1">
              <button type="button" aria-haspopup="dialog" onClick={() => setMore(true)} className={TAB}>
                <Ellipsis aria-hidden className="size-[1.375rem]" strokeWidth={1.8} />
                {m.layout_public_tab_more()}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      <MoreSheet open={more} onOpenChange={setMore} viewer={viewer} />
    </>
  );
}
