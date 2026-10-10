import { cn } from "cn";

import { Link } from "~/components/link";
import { ThemeToggle } from "~/components/theme-toggle";
import { buttonVariants } from "~/components/ui/button";
import { MobileMenu } from "~/routes/layout_public/components/mobile-menu";
import { SiteSearch } from "~/routes/layout_public/components/site-search";
import { NAV_ITEMS } from "~/routes/layout_public/nav-items";

/*===== Site Header =====*/
/**
 * Storefront header. Desktop: logo, nav, search, theme and sign-in in one row. Phones keep the logo and sign-in in
 * view and move the nav and search into a sheet.
 */
export function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="site-container flex h-16 items-center gap-6 lg:h-20">
        {/*------ Logo ------*/}
        <Link to="/" className="shrink-0 rounded-sm" aria-label="زروان، صفحه‌ی اصلی">
          {/* Single-colour artwork until a version in the site's palette exists. */}
          <img
            src="/logo-h.png"
            alt=""
            width={316}
            height={106}
            className="h-9 w-auto brightness-0 lg:h-11 dark:opacity-90 dark:invert"
          />
        </Link>

        {/*------ Desktop Nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="rounded-md px-3 py-2 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/*------ Actions ------*/}
        <div className="ms-auto flex items-center gap-1 lg:gap-2">
          <SiteSearch className="hidden w-64 xl:block xl:w-72" />
          <ThemeToggle />
          <Link to="/auth" className={cn(buttonVariants({ variant: "outline", className: "hidden sm:inline-flex" }))}>
            ورود یا ثبت‌نام
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
