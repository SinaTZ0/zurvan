import { env } from "~/env.server";
import { resolvePublicOrigin } from "~/lib/public-origin";
import { SITE_RULES } from "~/lib/site-rules";
import { type Locale, localizeHref } from "~/paraglide/runtime";

/*===== Site Files =====*/
// What the sitemap, robots.txt and the feed share (F16): the site's public origin and the pages a search engine should
// know. Server only: these routes answer with text, never a page.

/** The origin the visitor reached, as the pages' canonical addresses name it (`app/lib/site-origin.ts`). */
export function originOf(request: Request): string {
  return resolvePublicOrigin(request.headers, env.BETTER_AUTH_URL, env.HTTP_IP);
}

/** An internal path's absolute address in a language (`/blog` → `https://…/en/blog`). */
export function addressOf({ origin, path, locale }: { origin: string; path: string; locale: Locale }): string {
  return `${origin}${localizeHref(path, { locale })}`;
}

/**
 * The public pages that exist in both languages and say something on their own. Left out: sign-in, the purchase
 * pages, a dog's record and a certificate (private or meaningless without their number), and `/rules` until the owner
 * approves its wording (it is Persian only then).
 */
export function staticPaths(): string[] {
  return ["/", "/courses", "/blog", "/about", "/help", "/contact", "/privacy", "/join/partner"];
}

/** `/rules` once published: Persian only, so it gets no English address. */
export function persianOnlyPaths(): string[] {
  return SITE_RULES ? ["/rules"] : [];
}

/** Text safe inside XML. */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** A short-lived public cache: a new post shows up within the hour. */
export const SITE_FILE_CACHE = "public, max-age=3600";
