import { ArrowUpLeft } from "lucide-react";

import { BrandEmblem } from "~/components/brand-emblem";
import { Link } from "~/components/link";
import { PersonMenu } from "~/components/person-menu";
import { PROFILE_LINK } from "~/lib/account-links";
import { CENTER_DESCRIPTOR } from "~/lib/contact";
import { type DeskExitLink, type DeskNavItem } from "~/routes/layout_account/account-nav";
import { AccountTabs } from "~/routes/layout_account/components/account-tabs";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/*===== Account Header =====*/
/**
 * The storefront header's frame (the paper over a hairline, the emblem and wordmark), turned into the account's room:
 * a gold-outlined chip names the room, the sections are the storefront's nav links, then the way back out and the
 * person menu. Below `lg` it is only the app bar; the sections live in the floating tab bar (`AccountTabBar`), so the
 * person menu keeps just the settings.
 */
export function AccountHeader({
  firstName,
  phoneNumber,
  roomLabel,
  navItems,
  exitLink,
}: {
  firstName: string;
  phoneNumber: string | null;
  /** The room's name, e.g. «حساب من». */
  roomLabel: string;
  navItems: readonly DeskNavItem[];
  exitLink: DeskExitLink;
}) {
  return (
    <header className="relative z-30 mx-auto w-full max-w-6xl px-4 pt-3 md:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-foreground/25 pb-3">
        {/*------ Wordmark and the room ------*/}
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="زروان، صفحه‌ی اصلی" className={`flex items-center gap-2.5 rounded ${FOCUS}`}>
            <BrandEmblem className="size-12" />
            <span className="flex flex-col leading-tight">
              <span className="font-display text-3xl font-black text-foreground">زروان</span>
              {/* Dropped on the narrowest phones, where it would crowd the person menu. */}
              <span className="hidden text-[11px] text-foreground/65 min-[380px]:block">{CENTER_DESCRIPTOR}</span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-primary/60 px-3 py-1 text-xs font-bold text-primary lg:inline-block">
            {roomLabel}
          </span>
        </div>

        {/*------ Sections (wide only) ------*/}
        <AccountTabs items={navItems} label={roomLabel} className="hidden lg:block" />

        {/*------ The way out and the person ------*/}
        <div className="flex items-center gap-3">
          <Link
            to={exitLink.to}
            className={`hidden items-center gap-1 rounded px-1 py-1 text-[15px] text-foreground/85 transition-colors hover:text-foreground lg:inline-flex ${FOCUS}`}
          >
            {exitLink.label}
            <ArrowUpLeft aria-hidden className="size-3.5 text-foreground/50" />
          </Link>
          <PersonMenu firstName={firstName} phoneNumber={phoneNumber} links={[PROFILE_LINK]} />
        </div>
      </div>
    </header>
  );
}
