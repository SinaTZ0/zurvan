import { CENTER } from "~/lib/contact";
import { siteOrigin } from "~/lib/site-origin";
import { getLocale, type Locale, localizeHref, locales } from "~/paraglide/runtime";

/*===== Page Head =====*/
// The `<head>` of a page that exists in both languages (docs/i18n/english-version-plan.md, "SEO"): its title and
// description in the page's language, its canonical address, the `hreflang` alternates (Persian is also the
// `x-default`), and the Open Graph locale. A page that is never indexed (certificate, logbook) adds its own
// `robots: noindex` and still names its alternates.

const OG_LOCALES: Record<Locale, string> = { fa: "fa_IR", en: "en_US" };

/** The absolute address of an internal path (`/courses`) in a language. */
function addressIn({ path, locale }: { path: string; locale: Locale }): string {
  return `${siteOrigin()}${localizeHref(path, { locale })}`;
}

/**
 * The `meta` and `links` for a route's `head()`. `path` is the internal (Persian) path of this page, params filled in
 * (`/courses/cgc`); `title` and `description` are already in the page's language.
 *
 * @example head: () => pageHead({ path: "/", title: m.home_meta_title(...), description: m.home_meta_description(...) })
 */
export function pageHead({ path, title, description }: { path: string; title: string; description: string }) {
  const locale = getLocale();
  const canonical = addressIn({ path, locale });

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: CENTER.name },
      { property: "og:url", content: canonical },
      { property: "og:locale", content: OG_LOCALES[locale] },
      ...locales
        .filter((other) => other !== locale)
        .map((other) => ({ property: "og:locale:alternate", content: OG_LOCALES[other] })),
    ],
    links: [
      { rel: "canonical", href: canonical },
      ...locales.map((other) => ({ rel: "alternate", hrefLang: other, href: addressIn({ path, locale: other }) })),
      { rel: "alternate", hrefLang: "x-default", href: addressIn({ path, locale: "fa" }) },
    ],
  };
}
