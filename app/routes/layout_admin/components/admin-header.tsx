import { ArrowUpLeft } from "lucide-react";

import { BrandEmblem } from "~/components/brand-emblem";
import { Link } from "~/components/link";
import { PersonMenu } from "~/components/person-menu";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

/** The way out to the storefront: beside the person menu from `lg`, inside it on phones. */
const SITE_LINK = { label: "دیدن سایت", to: "/" } as const;

/*===== Admin Header =====*/
/**
 * The Admin's top bar: the storefront header's frame (the paper over an ink hairline, the emblem and the wordmark) with
 * a gold-outlined «مدیریت» chip naming the room. The chip stays on phones too, since it is the only sign of which room
 * this is. At the end come «دیدن سایت» (from `lg`; on phones it moves into the menu) and the person menu.
 *
 * Unlike the account's header it runs the full width and stays stuck to the top, because the Admin's lists are long
 * and the rail hangs under it (`top-16`). It paints the paper and its grain, so rows scroll under it unseen.
 */
export function AdminHeader({ firstName, phoneNumber }: { firstName: string; phoneNumber: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/25 bg-background paper-grain [view-transition-name:admin-header]">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        {/*------ Wordmark and the room ------*/}
        <Link to="/admin" aria-label="زروان، نمای کلی مدیریت" className={`flex items-center gap-2.5 rounded ${FOCUS}`}>
          <BrandEmblem className="size-10" />
          <span className="font-display text-2xl leading-none font-black text-foreground">زروان</span>
        </Link>
        <span className="rounded-full border border-primary/60 px-3 py-1 text-xs font-bold text-primary">مدیریت</span>

        {/*------ The way out and the person ------*/}
        <div className="ms-auto flex items-center gap-4">
          <Link
            to={SITE_LINK.to}
            className={`hidden items-center gap-1 rounded px-1 py-1 text-[15px] text-foreground/85 transition-colors hover:text-foreground lg:inline-flex ${FOCUS}`}
          >
            {SITE_LINK.label}
            <ArrowUpLeft aria-hidden className="size-3.5 text-foreground/50" />
          </Link>
          <PersonMenu
            firstName={firstName}
            phoneNumber={phoneNumber}
            roleLabel="مدیر"
            links={[{ ...SITE_LINK, phonesOnly: true }]}
          />
        </div>
      </div>
    </header>
  );
}
