import { Outlet } from "react-router";

import { SiteFooter } from "~/routes/layout_public/components/site-footer";
import { SiteHeader } from "~/routes/layout_public/components/site-header";

/*===== Public Layout =====*/
/** The storefront shell for every public page: header, the page, and the footer. No guard. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
