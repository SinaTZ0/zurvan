import { cn } from "cn";

import { BrandLogo } from "~/components/brand-logo";
import { Link } from "~/components/link";
import { NavLink } from "~/components/nav-link";
import { buttonVariants } from "~/components/ui/button";
import { MobileMenu } from "~/routes/layout_public/components/mobile-menu";
import { ViewerControls } from "~/routes/layout_public/components/viewer-controls";
import { NAV_CTA, NAV_ITEMS } from "~/routes/layout_public/nav-items";
import type { Viewer } from "~/routes/layout_public/viewer";

/*===== Site Header =====*/
/**
 * Storefront header. From `lg`: logo, the four page links, the gold «ارزیابی رایگان» pill and sign-in in one row. Below
 * `lg` the bar keeps the logo and sign-in and the menu button opens a sheet with the pill and the same links. A signed-in
 * `viewer` gets their cart and person menu in place of the sign-in button; the bar keeps its height and surface either
 * way. There is no search here: the owner wants search on the pages it belongs to, not in the menu.
 */
export function SiteHeader({ viewer }: { viewer: Viewer | null }) {
  return (
    <header className="border-b border-foreground/10 bg-jet">
      <div className="site-container flex h-16 items-center gap-6 lg:h-20">
        {/*------ Logo ------*/}
        <Link to="/" className="shrink-0 rounded-sm" aria-label="زروان، صفحه‌ی اصلی">
          <BrandLogo descriptor className="text-[1.625rem] lg:text-[1.875rem]" />
        </Link>

        {/*------ Desktop Nav ------*/}
        <nav aria-label="منوی اصلی" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-md px-3 py-2 text-sm font-bold transition-colors hover:text-foreground focus-visible:text-foreground",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/*------ Actions ------*/}
        <div className="ms-auto flex items-center gap-1 lg:gap-2">
          <Link to={NAV_CTA.to} className={cn(buttonVariants({ size: "sm" }), "hidden lg:inline-flex")}>
            {NAV_CTA.label}
          </Link>
          {viewer ? (
            <ViewerControls viewer={viewer} />
          ) : (
            <Link to="/auth" className={cn(buttonVariants({ variant: "outline", className: "hidden sm:inline-flex" }))}>
              ورود یا ثبت‌نام
            </Link>
          )}
          <MobileMenu viewer={viewer} />
        </div>
      </div>
    </header>
  );
}
