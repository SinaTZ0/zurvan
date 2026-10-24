import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Provider as JotaiProvider } from "jotai";
import { useEffect } from "react";

import { RootErrorPage } from "~/components/root-error-page";
import { SmoothScroll } from "~/components/smooth-scroll";
import { DirectionProvider } from "~/components/ui/direction";
import { Toaster } from "~/components/ui/toast";
import { TooltipProvider } from "~/components/ui/tooltip";
import { textDirection } from "~/lib/i18n";
import { captureInstallPrompt } from "~/lib/install-prompt";
import { PWA_COLOR, PWA_MANIFEST_PATH, pwaHref } from "~/lib/pwa";
import { registerServiceWorker } from "~/lib/register-service-worker";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";

// A side-effect import: Start links it in the head. (`?url` gave the server and client builds different hashes.)
import "./app.css";

// Chrome's install event can fire before hydration, so it is caught as soon as the client bundle runs (the banner is
// `InstallBanner`, in the storefront and account shells).
captureInstallPrompt();

/*===== Root Route =====*/
// Every page's loader gets the request's QueryClient (`app/router.tsx`) from the router context.
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // `viewport-fit=cover`: without it iOS reports no safe-area insets, and the phone tab bar, snapped to the bottom
    // edge, would sit under the home indicator.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      /*------ Installed App ------*/
      // docs/mobile-app.md. iOS reads its own tags, not the manifest. Its status bar is plain `black`, not
      // `black-translucent`, which draws the page under the clock: the body pads itself by the top inset (`app.css`, for
      // the Android app's camera strip), but that look hasn't been tried on an iPhone.
      { name: "theme-color", content: PWA_COLOR },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: m.shared_brand_name() },
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: pwaHref({ path: PWA_MANIFEST_PATH, locale: getLocale() }) },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  errorComponent: RootError,
  // An address outside every shell's own 404 (the storefront's `$` route catches the rest).
  notFoundComponent: () => <RootErrorPage missing />,
});

/*===== Document =====*/
function RootDocument({ children }: { children: React.ReactNode }) {
  // The language comes from the address (`/en/...` is English); it is fixed for the document, since changing it
  // reloads the page (`app/router.tsx`).
  const locale = getLocale();
  const dir = textDirection(locale);

  useEffect(registerServiceWorker, []);

  return (
    // The site has one theme, black and flat gold. `dark` turns on the `dark:` variants the UI components are written with;
    // `color-scheme` (set in app.css) makes native controls and scrollbars dark too.
    <html lang={locale} dir={dir} className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {/*===== Global Providers =====*/}
        {/* The QueryClientProvider comes from the router's SSR Query integration (`app/router.tsx`). */}
        {/* Without a Provider, Jotai uses a module-level default store that the server would
            share across requests, so each render tree gets its own store instead. */}
        {/* Base UI reads direction from context, not the `dir` attribute, so popups, sliders, and
            menus need the provider to position and navigate correctly in RTL (and LTR on the English pages). */}
        <JotaiProvider>
          <DirectionProvider direction={dir}>
            <TooltipProvider>
              <SmoothScroll>{children}</SmoothScroll>
              <Toaster />
            </TooltipProvider>
          </DirectionProvider>
        </JotaiProvider>
        <Scripts />
      </body>
    </html>
  );
}

/*===== Error =====*/
/**
 * The last error screen, for what breaks above a page's own boundary (a layout's guard or loader, the root itself). The
 * error's message and stack are shown only in development.
 */
function RootError({ error }: ErrorComponentProps) {
  const details =
    import.meta.env.DEV && error instanceof Error ? { message: error.message, stack: error.stack } : undefined;

  return <RootErrorPage missing={false} details={details} />;
}
