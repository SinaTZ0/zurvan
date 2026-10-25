import { CENTER } from "~/lib/contact";
import { siteOrigin } from "~/lib/site-origin";
import { getLocale, type Locale, localizeHref, locales } from "~/paraglide/runtime";

/*===== Page Head =====*/
// The `<head>` of a page that exists in both languages (docs/i18n/english-version-plan.md, "SEO"): its title and
// description in the page's language, its canonical address, the `hreflang` alternates (Persian is also the
// `x-default`), and the Open Graph locale. A page that is never indexed (certificate, logbook) adds its own
// `robots: noindex` and still names its alternates. A page that exists in Persian only (a blog post not yet translated)
// passes `locales: ["fa"]`, so no alternate points at an English address that answers 404.

const OG_LOCALES: Record<Locale, string> = { fa: "fa_IR", en: "en_US" };

/** The absolute address of an internal path (`/courses`) in a language. */
function addressIn({ path, locale }: { path: string; locale: Locale }): string {
  return `${siteOrigin()}${localizeHref(path, { locale })}`;
}

/** An image's address as link previews and structured data need it: absolute (media is `/media/…` in production). */
export function absoluteUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${siteOrigin()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Structured data (schema.org) as a `<script type="application/ld+json">`. `<` is escaped so text inside can never
 * close the script element.
 */
function jsonLdScript(data: Record<string, unknown>) {
  return { type: "application/ld+json", children: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/**
 * The `meta`, `links` and `scripts` for a route's `head()`. `path` is the internal (Persian) path of this page, params
 * filled in (`/courses/cgc`); `title` and `description` are already in the page's language.
 *
 * - `locales`: the languages the page exists in (default: both).
 * - `image`: the link-preview image (`og:image`), absolute or a path on this site; with it previews show a large card.
 * - `article`: makes it an `og:type=article` with its published and modified times.
 * - `jsonLd`: schema.org objects, each in its own script.
 *
 * @example head: () => pageHead({ path: "/", title: m.home_meta_title(...), description: m.home_meta_description(...) })
 */
export function pageHead({
  path,
  title,
  description,
  locales: available = locales,
  image,
  article,
  jsonLd = [],
}: {
  path: string;
  title: string;
  description: string;
  locales?: readonly Locale[];
  image?: { url: string; width: number; height: number; alt: string };
  article?: { publishedAt: Date; updatedAt: Date };
  jsonLd?: Record<string, unknown>[];
}) {
  const locale = getLocale();
  const canonical = addressIn({ path, locale });
  const others = available.filter((other) => other !== locale);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: article ? "article" : "website" },
      { property: "og:site_name", content: CENTER.name },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: OG_LOCALES[locale] },
      ...others.map((other) => ({ property: "og:locale:alternate", content: OG_LOCALES[other] })),
      ...(image
        ? [
            { property: "og:image", content: absoluteUrl(image.url) },
            { property: "og:image:width", content: String(image.width) },
            { property: "og:image:height", content: String(image.height) },
            { property: "og:image:alt", content: image.alt },
            { name: "twitter:card", content: "summary_large_image" },
          ]
        : []),
      ...(article
        ? [
            { property: "article:published_time", content: article.publishedAt.toISOString() },
            { property: "article:modified_time", content: article.updatedAt.toISOString() },
          ]
        : []),
    ],
    links: [
      { rel: "canonical", href: canonical },
      ...available.map((other) => ({ rel: "alternate", hrefLang: other, href: addressIn({ path, locale: other }) })),
      ...(available.includes("fa")
        ? [{ rel: "alternate", hrefLang: "x-default", href: addressIn({ path, locale: "fa" }) }]
        : []),
    ],
    scripts: jsonLd.map(jsonLdScript),
  };
}

/** The absolute address of an internal path in a language, for structured data (`BlogPosting.url`, breadcrumbs). */
export function absoluteAddress({ path, locale = getLocale() }: { path: string; locale?: Locale }): string {
  return addressIn({ path, locale });
}
