import { baseLocale, getLocale, type Locale, localizeHref, localizeUrl } from "~/paraglide/runtime";

/*===== Languages =====*/
// docs/i18n/english-version-plan.md: Persian is the base language at `/...`, English the public pages at `/en/...`.
// Paraglide (`project.inlang/paraglide.config.ts`) reads the language from the address; this module adds what it
// doesn't know: which pages stay Persian, and what the language means for the layout.

export type { Locale };

/** The address prefix of the English site. */
export const ENGLISH_PREFIX = "/en";

/** True while the page is rendered in English (`/en/...`). */
export function isEnglish(locale: Locale = getLocale()): boolean {
  return locale === "en";
}

/** The document's reading direction for a language. */
export function textDirection(locale: Locale = getLocale()): "rtl" | "ltr" {
  return locale === "fa" ? "rtl" : "ltr";
}

/*===== Persian-only Pages =====*/
// The Admin and the unpublished rules have no English (the plan's "Later"); sign-in and every signed-in customer and
// partner page do since Phase 4. Their `/en/...` addresses redirect to the Persian ones (`app/server.ts`), links to
// them are never prefixed (the router's `rewrite`, below) and open with a full page load, since the document's language
// and direction change (`Link`).
const PERSIAN_ONLY_PREFIXES = ["/admin", "/rules"] as const;

/** True for an internal (unprefixed) path that only exists in Persian: `/admin/dogs`, `/rules`, … but not `/rulesx`. */
export function isPersianOnlyPath(pathname: string): boolean {
  return PERSIAN_ONLY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * The Persian address for an English one of a Persian-only page (`/en/auth?x=1` → `/auth?x=1`), or null when the
 * address isn't one. Server-side, before the page renders.
 */
export function persianOnlyRedirect(url: URL): string | null {
  if (!url.pathname.startsWith(`${ENGLISH_PREFIX}/`)) return null;
  const pathname = url.pathname.slice(ENGLISH_PREFIX.length);
  return isPersianOnlyPath(pathname) ? `${pathname}${url.search}${url.hash}` : null;
}

/**
 * True when a link from the current page to `pathname` (internal) changes the document's language: from an English
 * page to a page that is only Persian. Such a link reloads the document instead of navigating in place.
 */
export function crossesLanguage(pathname: string): boolean {
  return getLocale() !== baseLocale && isPersianOnlyPath(pathname);
}

/*===== Router Rewrite =====*/
/**
 * The router's output rewrite (`app/router.tsx`): an internal URL becomes the address shown and linked in the current
 * language, except the Persian-only pages, which keep their one address.
 */
export function localizeOutputUrl(url: URL): URL {
  return isPersianOnlyPath(url.pathname) ? url : localizeUrl(url);
}

/**
 * An internal path (`/account/cart?payment=paid`) as the address to send someone to in a language (the page's own by
 * default): `/en/account/cart?payment=paid` in English, unchanged in Persian or for a Persian-only page. For the places
 * that write a `Location` themselves and so bypass the router's `rewrite`: `redirect({ href })` (TanStack writes the
 * href into the header as it is) and the payment gateway's return. A path given with `/en` is read as its internal one.
 */
export function localizedPath({ path, locale = getLocale() }: { path: string; locale?: Locale }): string {
  const pathname = path.split(/[?#]/, 1)[0] ?? path;
  if (isPersianOnlyPath(pathname)) return path;
  return localizeHref(path, { locale });
}

/*===== Language Switch =====*/
/** The same page's address in another language (`/en/about` ↔ `/about`), from the address shown (`publicHref`). */
export function hrefInLocale({ publicHref, locale }: { publicHref: string; locale: Locale }): string {
  return localizeHref(publicHref, { locale });
}
