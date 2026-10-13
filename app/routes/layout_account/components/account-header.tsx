import { BrandLogo } from "~/components/brand-logo";
import { PROFILE_LINK } from "~/lib/account-links";
import { Link } from "~/components/link";
import { PersonMenu } from "~/components/person-menu";
import { BOTTOM_TABS_FROM, type DeskExitLink, type DeskNavItem } from "~/routes/layout_account/account-nav";
import { AccountTabs } from "~/routes/layout_account/components/account-tabs";

/*===== Account Header =====*/
/**
 * The storefront's header bar, turned into a desk: the logo, the desk's sections, a way back out and the person menu.
 * Same height and surface as the storefront's, so moving between the two doesn't jump. The customer's account and the
 * trainer area share it, each with its own sections.
 */
export function AccountHeader({
  firstName,
  phoneNumber,
  roleLabel,
  navItems,
  navLabel,
  exitLink,
}: {
  firstName: string;
  phoneNumber: string | null;
  roleLabel?: string;
  navItems: readonly DeskNavItem[];
  /** The sections' landmark name, e.g. «حساب من». */
  navLabel: string;
  exitLink: DeskExitLink;
}) {
  // Below three sections phones have no bottom tab bar, so the person menu lists the sections and the exit link for
  // them. Desktop always shows them in the header.
  const sectionsInMenu = navItems.length < BOTTOM_TABS_FROM;
  const sectionLinks = sectionsInMenu
    ? [...navItems, exitLink].map(({ label, to }) => ({ label, to, phonesOnly: true }))
    : [];
  // Settings are never a tab, so the menu lists them on every screen size.
  const menuLinks = [...sectionLinks, PROFILE_LINK];

  return (
    <header className="border-b border-foreground/10 bg-jet">
      <div className="site-container flex h-16 items-stretch gap-6 lg:h-20">
        {/*------ Logo ------*/}
        <Link to="/" className="flex shrink-0 items-center self-center rounded-sm" aria-label="آموزش K9، صفحه‌ی اصلی">
          <BrandLogo className="text-[1.625rem] lg:text-[1.875rem]" />
        </Link>

        {/*------ Sections ------*/}
        <AccountTabs items={navItems} label={navLabel} className="hidden lg:block" />

        {/*------ Actions ------*/}
        <div className="ms-auto flex items-center gap-2 lg:gap-4">
          <Link
            to={exitLink.to}
            className="hidden rounded-sm px-2 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground lg:block"
          >
            {exitLink.label}
          </Link>
          <PersonMenu firstName={firstName} phoneNumber={phoneNumber} roleLabel={roleLabel} links={menuLinks} />
        </div>
      </div>
    </header>
  );
}
