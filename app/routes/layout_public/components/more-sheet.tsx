import { Info, LifeBuoy, LogIn, LogOut, Phone, ScrollText, Settings, Store, UserRound, X } from "lucide-react";

import { cn } from "cn";

import { BrandEmblem } from "~/components/brand-emblem";
import { Link } from "~/components/link";
import { SOCIAL_ICONS } from "~/components/social-icons";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { useSignOut } from "~/hooks/use-sign-out";
import { PROFILE_PATH } from "~/lib/account-links";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE } from "~/lib/contact";
import { MORE_LINKS } from "~/routes/layout_public/nav-items";
import type { Viewer } from "~/routes/layout_public/viewer";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

const ROW = cn(
  "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-base text-foreground transition-colors hover:bg-foreground/5",
  FOCUS,
);

const ICONS: Record<string, typeof Info> = {
  "/about": Info,
  "/help": LifeBuoy,
  "/join/partner": Store,
  "/rules": ScrollText,
};

/*===== More Sheet =====*/
/**
 * The tab bar's «بیشتر»: a bottom sheet with the pages the bar has no tab for, the account (sign in, or the person's
 * own area, settings and sign out) and how to reach the center. With the tab bar it covers every link the header has.
 */
export function MoreSheet({
  open,
  onOpenChange,
  viewer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: Viewer | null;
}) {
  const signOut = useSignOut();
  const close = () => onOpenChange(false);

  // A customer's account is `/account`; a partner or the Admin has their own panel (`homePath`).
  const accountPath = viewer?.role === "customer" ? "/account" : viewer?.homePath;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="gap-0 rounded-t-[2rem] border-foreground/15 bg-card paper-grain px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-foreground"
      >
        <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-foreground/20" />

        {/*------ Title ------*/}
        <div className="mt-3 flex items-start justify-between gap-3 px-3">
          <div className="flex items-center gap-2.5">
            <BrandEmblem className="size-11" />
            <div>
              <SheetTitle className="font-display text-2xl font-black text-foreground">زروان</SheetTitle>
              <p className="mt-0.5 text-xs text-foreground/65">{CENTER_DESCRIPTOR}</p>
            </div>
          </div>
          <SheetClose
            aria-label="بستن"
            className={cn("grid size-10 place-items-center rounded-full bg-foreground/8 text-foreground", FOCUS)}
          >
            <X aria-hidden className="size-5" />
          </SheetClose>
        </div>

        {/*------ Pages ------*/}
        <nav aria-label="صفحه‌های دیگر">
          <ul className="mt-4">
            {MORE_LINKS.map(({ label, to }) => {
              const Icon = ICONS[to] ?? Info;
              return (
                <li key={to}>
                  <Link to={to} onClick={close} className={ROW}>
                    <Icon aria-hidden className="size-5 text-primary" strokeWidth={1.8} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/*------ Account ------*/}
        <ul className="mt-2 border-t border-foreground/15 pt-2">
          {viewer ? (
            <>
              {accountPath && (
                <li>
                  <Link to={accountPath} onClick={close} className={ROW}>
                    <UserRound aria-hidden className="size-5 text-primary" strokeWidth={1.8} />
                    {viewer.role === "customer" ? "حساب من" : "پنل من"}
                  </Link>
                </li>
              )}
              {/* Settings are for customers and partners; the Admin's own area carries his. */}
              {viewer.role !== "admin" && (
                <li>
                  <Link to={PROFILE_PATH} onClick={close} className={ROW}>
                    <Settings aria-hidden className="size-5 text-primary" strokeWidth={1.8} />
                    تنظیمات حساب
                  </Link>
                </li>
              )}
              <li>
                <button
                  type="button"
                  disabled={signOut.isPending}
                  onClick={() => {
                    close();
                    signOut.mutate();
                  }}
                  className={ROW}
                >
                  <LogOut aria-hidden className="size-5 text-primary rtl:-scale-x-100" strokeWidth={1.8} />
                  خروج
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/auth" onClick={close} className={ROW}>
                <LogIn aria-hidden className="size-5 text-primary" strokeWidth={1.8} />
                ورود یا ثبت‌نام
              </Link>
            </li>
          )}
        </ul>

        {/*------ Reach the center ------*/}
        <div className="mt-3 border-t border-foreground/15 pt-4">
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            className={cn(
              "flex items-center justify-center gap-2 rounded-full border border-foreground/30 py-3 font-bold text-foreground",
              FOCUS,
            )}
          >
            <Phone aria-hidden className="size-4 text-primary" />
            تماس با{" "}
            <span dir="ltr" className="tabular-nums">
              {CENTER_PHONE.display}
            </span>
          </a>
          <ul className="mt-4 flex justify-center gap-6 text-sm text-foreground/75">
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
                    <Icon className="size-4 text-primary" />
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
