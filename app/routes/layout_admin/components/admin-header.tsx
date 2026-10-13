import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { PersonMenu } from "~/components/person-menu";

/*===== Admin Header =====*/
/**
 * The Admin's top bar, the same on every screen size: the logo with a small «مدیریت» tag, and the person menu. The
 * pages themselves are in the rail (desktop) or the bottom tabs (phones), so the bar stays short.
 */
export function AdminHeader({ firstName, phoneNumber }: { firstName: string; phoneNumber: string | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-jet">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/admin" className="flex shrink-0 items-center rounded-sm" aria-label="آموزش K9، مدیریت">
          <BrandLogo className="text-[1.375rem]" />
        </Link>
        <span className="rounded-full border border-primary/40 px-2.5 py-0.5 text-xs font-bold text-primary">
          مدیریت
        </span>

        <div className="ms-auto flex items-center gap-2">
          <PersonMenu
            firstName={firstName}
            phoneNumber={phoneNumber}
            roleLabel="مدیر"
            links={[{ label: "دیدن سایت", to: "/" }]}
          />
        </div>
      </div>
    </header>
  );
}
