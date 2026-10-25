import { createFileRoute } from "@tanstack/react-router";

import { SITE_FILE_CACHE, originOf } from "~/routes/seo_files/site-files";

/*===== Robots =====*/
/**
 * `/robots.txt` (F16): everything public may be read; the Admin, the account pages, sign-in, the purchase pages and
 * the API may not (they are signed-in or meaningless to a search engine). Names the sitemap.
 */
export const Route = createFileRoute("/robots.txt")({
  server: { handlers: { GET: ({ request }) => robots(request) } },
});

const PRIVATE_PREFIXES = ["/admin", "/account", "/auth", "/buy", "/assessment", "/rpc", "/api", "/payment", "/pwa"];

function robots(request: Request): Response {
  // Each private prefix in Persian and under `/en`, since the English site mirrors them.
  const disallow = PRIVATE_PREFIXES.flatMap((prefix) => [`Disallow: ${prefix}`, `Disallow: /en${prefix}`]);
  const body = ["User-agent: *", "Allow: /", ...disallow, "", `Sitemap: ${originOf(request)}/sitemap.xml`, ""].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": SITE_FILE_CACHE },
  });
}
