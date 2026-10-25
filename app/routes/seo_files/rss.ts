import { createFileRoute } from "@tanstack/react-router";

import { db } from "~/db/client.server";
import { findPublishedPostDates } from "~/orpc/blog/repository";
import { SITE_FILE_CACHE, addressOf, escapeXml, originOf } from "~/routes/seo_files/site-files";

/*===== RSS =====*/
/**
 * `/blog/rss.xml` (F16): the newest published posts, in Persian (the base language), for feed readers. The feed's own
 * title and description are the blog page's, in Persian like the SMS texts: a feed has no page language to follow.
 */
export const Route = createFileRoute("/blog/rss.xml")({
  server: { handlers: { GET: ({ request }) => rss(request) } },
});

const FEED_SIZE = 20;
const FEED_TITLE = "وبلاگ زروان";
const FEED_DESCRIPTION = "نوشته‌های مربی زروان درباره‌ی رفتار سگ، آموزش، توله‌ها و نگهداری.";

async function rss(request: Request): Promise<Response> {
  const origin = originOf(request);
  const posts = (await findPublishedPostDates({ db })).slice(0, FEED_SIZE);
  const blogAddress = addressOf({ origin, path: "/blog", locale: "fa" });

  const items = posts.map((post) => {
    const link = addressOf({ origin, path: `/blog/${post.slug}`, locale: "fa" });
    return [
      "<item>",
      `<title>${escapeXml(post.title)}</title>`,
      `<link>${escapeXml(link)}</link>`,
      `<guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `<description>${escapeXml(post.excerpt)}</description>`,
      post.publishedAt ? `<pubDate>${post.publishedAt.toUTCString()}</pubDate>` : "",
      "</item>",
    ].join("");
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${escapeXml(FEED_TITLE)}</title>
<link>${escapeXml(blogAddress)}</link>
<description>${escapeXml(FEED_DESCRIPTION)}</description>
<language>fa</language>
<atom:link href="${escapeXml(`${origin}/blog/rss.xml`)}" rel="self" type="application/rss+xml"/>
${items.join("\n")}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": SITE_FILE_CACHE },
  });
}
