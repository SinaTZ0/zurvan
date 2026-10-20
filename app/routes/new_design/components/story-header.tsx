import { useLenis } from "lenis/react";
import {
  BookOpen,
  ClipboardCheck,
  Ellipsis,
  House,
  Info,
  LifeBuoy,
  LogIn,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "cn";

import { Link } from "~/components/link";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE } from "~/lib/contact";
import { Emblem, SOCIAL_ICONS } from "~/routes/new_design/components/story-brand";
import { EvaluationButton } from "~/routes/new_design/components/story-parts";
import { LINKS } from "~/routes/new_design/content";

const NAV = [
  { label: "دوره‌ها", to: LINKS.courses },
  { label: "درباره", to: LINKS.about },
  { label: "تماس", to: LINKS.contact },
  { label: "راهنما", to: LINKS.help },
] as const;

const LINK =
  "rounded px-1 py-1 text-[15px] text-(--st-ink)/85 hover:text-(--st-ink) hover:underline underline-offset-8 decoration-(--st-mustard) decoration-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--st-ink)";

/*===== Header =====*/
// Wide, the header carries the whole nav. Below lg it's only an app bar (the wordmark and the account), and the nav
// moves to the tab bar at the bottom of the screen, where a thumb reaches it.
export function StoryHeader() {
  return (
    <header className="relative z-30 mx-auto max-w-6xl px-4 pt-3 md:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-(--st-line)/25 pb-3">
        {/*------ Wordmark ------*/}
        <Link to="/" className={cn("flex items-center gap-2.5 rounded", FOCUS)}>
          <Emblem className="size-12" />
          <span className="flex flex-col leading-tight">
            <span className="font-display text-3xl font-black text-(--st-ink)">زروان</span>
            <span className="text-[11px] text-(--st-ink)/65">{CENTER_DESCRIPTOR}</span>
          </span>
        </Link>

        {/*------ Desktop nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} className={LINK}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to={LINKS.auth} className={cn(LINK, "hidden lg:block")}>
            ورود
          </Link>
          <EvaluationButton className="hidden px-5 py-2 text-sm lg:inline-flex">
            ارزیابی رایگان
          </EvaluationButton>

          {/*------ App bar: the account ------*/}
          <Link
            to={LINKS.auth}
            aria-label="ورود به حساب"
            className={cn(
              "grid size-11 place-items-center rounded-full border border-(--st-line)/25 text-(--st-ink) lg:hidden",
              FOCUS,
            )}
          >
            <UserRound aria-hidden className="size-5" strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </header>
  );
}

/*===== Tab Bar =====*/
// A floating bar held off the screen's edges, as on a phone app. The evaluation is the gold tile in the middle, the
// one action every page leads to; it sits flush in the bar rather than raised over it, which read as an ad. The bar
// is the page's own colour with a hairline of ink, so the gold tile is the only bright thing on it. Its height (4.25rem + the 0.75rem gap) is what the footer and the pinned
// services scene leave free at the bottom.
const TAB =
  "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] leading-none text-(--st-ink)/70 transition-colors hover:text-(--st-ink) " +
  FOCUS;

/** The phone's tab bar, below lg: home, courses, the evaluation, contact and a sheet with the rest. */
export function StoryTabBar() {
  const lenis = useLenis();
  const [more, setMore] = useState(false);

  /*------ Home: this is the home page, so the tab takes the visitor back to its top ------*/
  function toTop() {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <nav
        aria-label="منوی اصلی"
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md lg:hidden"
      >
        <ul className="flex h-[4.25rem] items-stretch rounded-[1.6rem] border border-(--st-line)/15 bg-(--st-paper-2)/90 px-1.5 shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md">
          <li className="flex flex-1">
            <button
              type="button"
              aria-current="page"
              onClick={toTop}
              className={cn(TAB, "text-(--st-ink)")}
            >
              <House aria-hidden className="size-[1.375rem] text-(--st-red)" strokeWidth={1.8} />
              خانه
            </button>
          </li>
          <li className="flex flex-1">
            <Link to={LINKS.courses} className={TAB}>
              <BookOpen aria-hidden className="size-[1.375rem]" strokeWidth={1.8} />
              دوره‌ها
            </Link>
          </li>

          {/*------ The action ------*/}
          <li className="flex flex-1 py-2">
            <Link
              to={LINKS.evaluation}
              className={cn(
                TAB,
                "bg-(--st-red) font-bold text-(--st-on-red) hover:bg-(--st-red-deep) hover:text-(--st-on-red)",
              )}
            >
              <ClipboardCheck aria-hidden className="size-[1.375rem]" strokeWidth={2} />
              ارزیابی
            </Link>
          </li>

          <li className="flex flex-1">
            <Link to={LINKS.contact} className={TAB}>
              <Phone aria-hidden className="size-[1.375rem]" strokeWidth={1.8} />
              تماس
            </Link>
          </li>
          <li className="flex flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setMore(true)}
              className={TAB}
            >
              <Ellipsis aria-hidden className="size-[1.375rem]" strokeWidth={1.8} />
              بیشتر
            </button>
          </li>
        </ul>
      </nav>

      <MoreSheet open={more} onOpenChange={setMore} />
    </>
  );
}

/*===== More Sheet =====*/
// The sheet is portalled out of the page, so it takes `st-root` itself to get the page's colours.
const SHEET_LINKS = [
  { label: "درباره‌ی ما", to: LINKS.about, icon: Info },
  { label: "راهنما و سؤال‌های رایج", to: LINKS.help, icon: LifeBuoy },
  { label: "ورود یا ثبت‌نام", to: LINKS.auth, icon: LogIn },
] as const;

function MoreSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const row = cn(
    "flex items-center gap-3 rounded-2xl px-3 py-3 text-base text-(--st-ink) transition-colors hover:bg-(--st-ink)/5",
    FOCUS,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="st-root gap-0 rounded-t-[2rem] border-(--st-line)/15 bg-(--st-paper-2) px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-(--st-ink)"
      >
        <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-(--st-ink)/20" />

        {/*------ Title ------*/}
        <div className="mt-3 flex items-start justify-between gap-3 px-3">
          <div className="flex items-center gap-2.5">
            <Emblem className="size-11" />
            <div>
              <SheetTitle className="font-display text-2xl font-black text-(--st-ink)">
                زروان
              </SheetTitle>
              <p className="mt-0.5 text-xs text-(--st-ink)/65">{CENTER_DESCRIPTOR}</p>
            </div>
          </div>
          <SheetClose
            aria-label="بستن"
            className={cn(
              "grid size-10 place-items-center rounded-full bg-(--st-ink)/8 text-(--st-ink)",
              FOCUS,
            )}
          >
            <X aria-hidden className="size-5" />
          </SheetClose>
        </div>

        {/*------ Pages ------*/}
        <ul className="mt-4">
          {SHEET_LINKS.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <Link to={to} onClick={() => onOpenChange(false)} className={row}>
                <Icon aria-hidden className="size-5 text-(--st-red)" strokeWidth={1.8} />
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/*------ Reach the center ------*/}
        <div className="mt-3 border-t border-(--st-line)/15 pt-4">
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full border border-(--st-line)/30 py-3 font-bold text-(--st-ink)",
              FOCUS,
            )}
          >
            <Phone aria-hidden className="size-4 text-(--st-red)" />
            تماس با{" "}
            <span dir="ltr" className="tabular-nums">
              {CENTER_PHONE.display}
            </span>
          </a>
          <ul className="mt-4 flex justify-center gap-6 text-sm text-(--st-ink)/75">
            {CENTER_LINKS.map((item) => {
              const Icon = SOCIAL_ICONS[item.href];
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={cn("flex items-center gap-1.5 rounded", FOCUS)}
                  >
                    <Icon className="size-4 text-(--st-red)" />
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}
