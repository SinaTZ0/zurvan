import { createFileRoute } from "@tanstack/react-router";
import { Outlet, useMatches } from "react-router";

import { CartSync } from "~/components/cart-sync";
import { roleHomePath } from "~/lib/role-home";
import { createServerClient } from "~/orpc/server-client.server";
import { SiteFooter } from "~/routes/layout_public/components/site-footer";
import { SiteHeader } from "~/routes/layout_public/components/site-header";
import { TabBar } from "~/routes/layout_public/components/tab-bar";
import type { Viewer } from "~/routes/layout_public/viewer";

import type { Route } from "./+types/layout-public";

/*===== Loader =====*/
/**
 * Who is looking, for the header's account controls. The shell has no guard: a visitor, a blocked account or a new
 * account that hasn't given its name yet all look like a visitor, and the page itself still renders for them.
 */
export async function loader({ request }: Route.LoaderArgs): Promise<{ viewer: Viewer | null }> {
  const session = await createServerClient(request).session.get();
  if (session.status !== "active") return { viewer: null };

  const { user } = session;
  const home = roleHomePath(user.role);
  return {
    viewer: {
      role: user.role,
      firstName: user.firstName,
      phoneNumber: user.phoneNumber,
      homePath: user.role !== "customer" && home !== "/" ? home : null,
    },
  };
}

/*===== Public Layout =====*/
/**
 * A page's `handle` for this shell. `flushFooter` drops the gap above the footer, for a page whose last band runs into
 * it (the home page's closing scene, where the dog's leash dangles over the footer's top edge).
 */
export type PublicLayoutHandle = { flushFooter?: boolean };

/**
 * The storefront shell for every public page: header, the page, the footer, and below `lg` the floating tab bar. No
 * guard. The page sits on the body's grained paper; the tab bar is fixed, and the footer's own bottom padding keeps
 * the page's last words clear of it.
 */
export default function PublicLayout({ loaderData }: Route.ComponentProps) {
  const flushFooter = useMatches().some((match) => (match.handle as PublicLayoutHandle | undefined)?.flushFooter);

  return (
    <div className="flex min-h-svh flex-col overflow-x-clip">
      {/* A customer's cart follows them to every device (F5); nobody else has one. */}
      {loaderData.viewer?.role === "customer" && <CartSync />}
      <SiteHeader viewer={loaderData.viewer} />
      <main id="main" className={flushFooter ? "flex-1" : "flex-1 pb-section-md"}>
        <Outlet />
      </main>
      <SiteFooter />
      <TabBar viewer={loaderData.viewer} />
    </div>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/_public")({});
