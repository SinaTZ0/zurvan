import { useNavigate } from "@tanstack/react-router";

/*===== Constants =====*/
const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/** Punctuation that ends a sentence after a link rather than belonging to it. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]،؛]+$/;

const LINK_CLASS =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 [overflow-wrap:anywhere] outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/*===== SMS Body =====*/
/**
 * A message's text as the receiver's phone would show it, with its links made real. The text is never reworded or
 * re-digited: it is the log of what went out, so «12345» stays as it was sent.
 *
 * A link into the app itself (the new-request SMS to the Admin carries `/admin/evaluations?evaluation=…`) opens here, on
 * whatever host he is using, so it opens the request's drawer; any other link opens in a new tab. Each link is written
 * left to right and may break anywhere, so a long one wraps inside the bubble instead of widening it.
 */
export function SmsBody({ body, appOrigin }: { body: string; appOrigin: string }) {
  const parts = body.split(URL_PATTERN);

  return parts.map((part, index) => {
    // `split` with a capture group puts the matches at the odd indexes.
    if (index % 2 === 0) return part;

    const trailing = TRAILING_PUNCTUATION.exec(part)?.[0] ?? "";
    const href = trailing ? part.slice(0, -trailing.length) : part;
    const url = parseUrl(href);

    return (
      <span key={`${index}-${href}`}>
        {url?.origin === appOrigin ? (
          <InAppLink path={`${url.pathname}${url.search}${url.hash}`}>{href}</InAppLink>
        ) : (
          <a href={href} target="_blank" rel="noreferrer" dir="ltr" className={LINK_CLASS}>
            {href}
          </a>
        )}
        {trailing}
      </span>
    );
  });
}

/*===== In-App Link =====*/
/**
 * A link into the app found in a message's text. The path comes from the data, not the code, so it can't be a typed
 * route: it is a plain anchor (a new tab works as usual) whose plain click the router opens in place from the built
 * `href`, as `Link` would.
 */
function InAppLink({ path, children }: { path: string; children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <a
      href={path}
      dir="ltr"
      className={LINK_CLASS}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        void navigate({ href: path });
      }}
    >
      {children}
    </a>
  );
}

/*===== Helpers =====*/
function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}
