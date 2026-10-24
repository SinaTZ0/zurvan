import type { Locale } from "~/lib/i18n";

/*===== Installable App =====*/
// The site installs as an app (a PWA) and ships as an Android app that opens it full-screen (a TWA, `mobile/twa/`). See
// docs/mobile-app.md. The manifest and the offline page live under `/pwa`, outside Paraglide's routing
// (`project.inlang/paraglide.config.ts`): each language's copy is one fixed address, `?lang=en` for English.

/** The app's frame colour: the paper (`--base` in `app/app.css`), for the status bar, the splash and the manifest. */
export const PWA_COLOR = "#141414";

/** The query parameter naming the English copy of a `/pwa` address. */
export const PWA_LOCALE_PARAM = "lang";

export const PWA_MANIFEST_PATH = "/pwa/manifest.webmanifest";

/** The offline page the service worker (`public/sw.js`, which repeats these addresses) shows when a page can't load. */
export const PWA_OFFLINE_PATH = "/pwa/offline";

/** A `/pwa` address in a language: unchanged for Persian, `?lang=en` for English. */
export function pwaHref({ path, locale }: { path: string; locale: Locale }): string {
  return locale === "en" ? `${path}?${PWA_LOCALE_PARAM}=en` : path;
}

/** The language a `/pwa` request asks for. */
export function pwaLocale(request: Request): Locale {
  return new URL(request.url).searchParams.get(PWA_LOCALE_PARAM) === "en" ? "en" : "fa";
}
