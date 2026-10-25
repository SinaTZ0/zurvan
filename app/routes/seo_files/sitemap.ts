import { createFileRoute } from "@tanstack/react-router";

import { db } from "~/db/client.server";
import { findPublishedPostDates } from "~/orpc/blog/repository";
import { findApprovedCourses } from "~/orpc/course/repository";
import type { Locale } from "~/paraglide/runtime";
import {
  SITE_FILE_CACHE,
  addressOf,
  escapeXml,
  originOf,
  persianOnlyPaths,
  staticPaths,
} from "~/routes/seo_files/site-files";

/*===== Sitemap =====*/
/**
 * `/sitemap.xml` (F16): every public page, course and published post, each with its other-language address as an
 * `hreflang` alternate, the way the pages' own `<head>` names them. A post without English text has its Persian
 * address only. Dates are given where the data has them (courses and posts).
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: { handlers: { GET: ({ request }) => sitemap(request) } },
});

type Entry = { path: string; locales: Locale[]; lastModified?: Date };

async function sitemap(request: Request): Promise<Response> {
  const origin = originOf(request);
  const [courses, posts] = await Promise.all([findApprovedCourses({ db }), findPublishedPostDates({ db })]);

  const entries: Entry[] = [
    ...staticPaths().map((path) => ({ path, locales: ["fa", "en"] as Locale[] })),
    ...persianOnlyPaths().map((path) => ({ path, locales: ["fa"] as Locale[] })),
    ...courses.map((course) => ({
      path: `/courses/${course.slug}`,
      locales: ["fa", "en"] as Locale[],
      lastModified: course.updatedAt,
    })),
    ...posts.map((post) => ({
      path: `/blog/${post.slug}`,
      locales: (post.hasEnglish ? ["fa", "en"] : ["fa"]) as Locale[],
      lastModified: post.updatedAt,
    })),
  ];

  // One <url> per address; each lists all the entry's addresses as alternates, itself included (Google's rule).
  const urls = entries.flatMap((entry) =>
    entry.locales.map((locale) => {
      const alternates =
        entry.locales.length > 1
          ? entry.locales
              .map(
                (other) =>
                  `<xhtml:link rel="alternate" hreflang="${other}" href="${escapeXml(addressOf({ origin, path: entry.path, locale: other }))}"/>`,
              )
              .join("")
          : "";
      const lastmod = entry.lastModified ? `<lastmod>${entry.lastModified.toISOString()}</lastmod>` : "";
      return `<url><loc>${escapeXml(addressOf({ origin, path: entry.path, locale }))}</loc>${lastmod}${alternates}</url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": SITE_FILE_CACHE },
  });
}
