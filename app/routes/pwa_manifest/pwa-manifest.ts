import { createFileRoute } from "@tanstack/react-router";

import { localizedPath, textDirection } from "~/lib/i18n";
import { PWA_COLOR, pwaLocale } from "~/lib/pwa";
import { m } from "~/paraglide/messages";

/*===== Web App Manifest =====*/
/**
 * What the browser installs: the name, the icons, the colours and where the app opens, in the language of the page
 * that links it (`app/root.tsx`). The Android app (`mobile/twa/twa-manifest.json`) was generated from the Persian one.
 *
 * `id` is the same in both languages, so installing from a Persian and an English page is one app, not two.
 */
function manifest(request: Request) {
  const locale = pwaLocale(request);
  const path = (to: string) => localizedPath({ path: to, locale });

  const body = {
    id: "/",
    name: m.shared_brand_name({}, { locale }),
    short_name: m.shared_brand_name({}, { locale }),
    description: m.shared_contact_descriptor({}, { locale }),
    lang: locale,
    dir: textDirection(locale),
    start_url: path("/"),
    scope: "/",
    display: "standalone",
    background_color: PWA_COLOR,
    theme_color: PWA_COLOR,
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // The Android app (`mobile/twa/`), so the install banner can ask Chrome whether it is already on the phone
    // (`isAndroidAppInstalled` in `app/lib/install-prompt.ts`). With `prefer_related_applications` off, Chrome still
    // offers to install the site itself.
    related_applications: [{ platform: "play", id: "ir.zurvann.app" }],
    prefer_related_applications: false,
    // The long-press menu on the home-screen icon.
    shortcuts: [
      { name: m.pwa_shortcut_courses({}, { locale }), url: path("/courses") },
      { name: m.pwa_shortcut_evaluation({}, { locale }), url: path("/assessment") },
      { name: m.pwa_shortcut_account({}, { locale }), url: path("/account") },
    ],
  };

  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}

export const Route = createFileRoute("/pwa/manifest.webmanifest")({
  server: { handlers: { GET: ({ request }) => manifest(request) } },
});
