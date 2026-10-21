import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { useState } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { RootErrorPage } from "~/components/root-error-page";
import { SmoothScroll } from "~/components/smooth-scroll";
import { DirectionProvider } from "~/components/ui/direction";
import { Toaster } from "~/components/ui/toast";
import { TooltipProvider } from "~/components/ui/tooltip";
import { referralCookie, serializeReferralCookie } from "~/lib/referral.server";

import type { Route } from "./+types/root";
import "./app.css";

/*===== Referral Code =====*/
// A partner's link opens the home page with `?ref=<code>`, and the sign-in page can carry it on. The cookie is set here,
// on the server's response, rather than in those pages' loaders: TanStack Start's loaders also run in the browser,
// where this becomes a request middleware. A client navigation asks for `<path>.data` (`/_.data` for the home page).
const REFERRAL_LANDINGS = new Set(["/", "/_.data", "/auth", "/auth.data"]);

const rememberReferral: Route.MiddlewareFunction = async ({ request }, next) => {
  const response = await next();
  if (!REFERRAL_LANDINGS.has(new URL(request.url).pathname)) return response;

  const cookie = referralCookie({ requestUrl: request.url, headers: request.headers });
  if (cookie) response.headers.append("Set-Cookie", serializeReferralCookie(cookie));
  return response;
};

export const middleware: Route.MiddlewareFunction[] = [rememberReferral];

export function Layout({ children }: { children: React.ReactNode }) {
  // One client per render tree (like the Jotai store): a module-level client on the server would
  // share cached data between users' requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Loader data seeds most queries, so don't refetch it the moment the page hydrates.
        defaultOptions: { queries: { staleTime: 30_000 } },
      }),
  );

  return (
    // The site has one theme, black and flat gold. `dark` turns on the `dark:` variants the UI components are written with;
    // `color-scheme` (set in app.css) makes native controls and scrollbars dark too.
    <html lang="fa" dir="rtl" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <Meta />
        <Links />
      </head>
      <body>
        {/*===== Global Providers =====*/}
        {/* Base UI reads direction from context, not the `dir` attribute, so popups, sliders, and
            menus need the provider to position and navigate correctly in RTL. */}
        {/* Without a Provider, Jotai uses a module-level default store that the server would
            share across requests, so each render tree gets its own store instead. */}
        {/* nuqs skips loaders by default (`shallow: true`). Most URL state here filters loader data, so
            updates revalidate unless a param opts into `shallow: true` for UI-only state. */}
        <NuqsAdapter defaultOptions={{ shallow: false }}>
          <QueryClientProvider client={queryClient}>
            <JotaiProvider>
              <DirectionProvider direction="rtl">
                <TooltipProvider>
                  <SmoothScroll>{children}</SmoothScroll>
                  <Toaster />
                </TooltipProvider>
              </DirectionProvider>
            </JotaiProvider>
          </QueryClientProvider>
        </NuqsAdapter>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/**
 * The last error screen, for what breaks above a page's own boundary. A 404 says the address points nowhere; anything
 * else offers a retry. The error's message and stack are shown only in development.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const missing = isRouteErrorResponse(error) && error.status === 404;
  const details =
    import.meta.env.DEV && error instanceof Error ? { message: error.message, stack: error.stack } : undefined;

  return <RootErrorPage missing={missing} details={details} />;
}
