import { Link } from "~/components/link";
import { isInternalHref, isSafeHref } from "~/lib/blog-body";
import { m } from "~/paraglide/messages";

/*===== Look =====*/
// Gold words with a soft underline that firms up on hover: a link reads as one inside the calm text without shouting.
const LINK =
  "rounded-sm font-bold text-primary underline decoration-primary/40 decoration-2 underline-offset-[6px] transition-colors outline-none hover:decoration-primary focus-visible:ring-3 focus-visible:ring-ring/50";

/*===== Internal Address =====*/
/**
 * An internal address split the way the router's `Link` takes it. The article's links are the author's own text, not
 * routes the code knows, so the path is handed over untyped; the router's output rewrite still puts `/en` in front on
 * the English pages, which a plain `<a href>` wouldn't. A file (`/blog/rss.xml`) is a server answer, not a page, so it
 * stays a plain link.
 */
function splitInternal(url: string) {
  const parsed = new URL(url.trim(), "http://local");
  if (/\.[a-z0-9]+$/i.test(parsed.pathname)) return null;
  return {
    pathname: parsed.pathname,
    search: Object.fromEntries(parsed.searchParams),
    hash: parsed.hash.replace(/^#/, "") || undefined,
  };
}

/*===== Body Link =====*/
/**
 * A link written in a post. The address is checked again here (defence in depth: the server already dropped unsafe
 * ones), and an unsafe one is drawn as its plain words. An internal one goes through the router; an external one opens
 * in a new tab, and says so to screen readers. In the Admin's preview the article stops every click itself
 * (`PostArticle`), so nothing here needs to know about it.
 */
export function BodyLink({ url, children }: { url: string; children: React.ReactNode }) {
  if (!isSafeHref(url)) return <>{children}</>;

  if (isInternalHref(url)) {
    const internal = splitInternal(url);
    if (internal) {
      return (
        <Link
          // The author's path, not a route the types know.
          to={internal.pathname as never}
          search={internal.search as never}
          hash={internal.hash}
          className={LINK}
        >
          {children}
        </Link>
      );
    }
    return (
      <a href={url.trim()} className={LINK}>
        {children}
      </a>
    );
  }

  /*------ Elsewhere ------*/
  // `mailto:` and `tel:` open an app, not a page, so they keep the tab.
  const web = /^https?:/i.test(url.trim());
  return (
    <a href={url.trim()} className={LINK} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
      {web && <span className="sr-only"> {m.blog_body_new_tab()}</span>}
    </a>
  );
}
