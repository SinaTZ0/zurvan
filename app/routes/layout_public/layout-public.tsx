import { Outlet } from "react-router";

import { authForHeaders } from "~/lib/auth.server";
import { roleHomePath } from "~/lib/session-guard.server";
import { SiteFooter } from "~/routes/layout_public/components/site-footer";
import { SiteHeader } from "~/routes/layout_public/components/site-header";
import type { Viewer } from "~/routes/layout_public/viewer";

import type { Route } from "./+types/layout-public";

/*===== Loader =====*/
/**
 * Who is looking, for the header's account controls. The shell has no guard: a visitor, a blocked account or a new
 * account that hasn't given its name yet all look like a visitor, and the page itself still renders for them.
 */
export async function loader({ request }: Route.LoaderArgs): Promise<{ viewer: Viewer | null }> {
  const session = await authForHeaders(request.headers).api.getSession({ headers: request.headers });
  const user = session?.user;

  if (!user || user.status === "blocked" || !user.firstName) return { viewer: null };
  if (user.role !== "customer" && user.role !== "partner" && user.role !== "admin") return { viewer: null };

  const home = roleHomePath(user.role);
  return {
    viewer: {
      role: user.role,
      firstName: user.firstName,
      phoneNumber: user.phoneNumber ?? null,
      homePath: user.role !== "customer" && home !== "/" ? home : null,
    },
  };
}

/*===== Public Layout =====*/
/** The storefront shell for every public page: header, the page, and the footer. No guard. */
export default function PublicLayout({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader viewer={loaderData.viewer} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
