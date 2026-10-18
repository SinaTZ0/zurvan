/*===== Hero State =====*/
// Which of the home hero's dogs is showing is a small piece of memory, not a timer. The rules (docs/overnight/00-AUDIT.md):
//
//   1. A new browser session advances the stored state by one (the first visit ever shows the first dog).
//   2. Arriving on Home by a link or button advances it by one (the client does this, see `HomeHero`).
//   3. Back, forward and reload keep the dog that was showing. Waiting on the page never changes it.
//
// The state lives in two cookies so the server paints the right photo first: a persistent one with the dog's index, and
// a session one that only says "this session has already been counted". Browser-safe and pure, so it is easy to test.

export const HERO_COOKIE = "zurvan_hero";
export const HERO_SESSION_COOKIE = "zurvan_hero_s";

/** A year, in seconds: the memory of the last dog outlives a browser session on purpose. */
export const HERO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** The dog after `current`, wrapping to the first. */
export function nextHeroIndex({ current, count }: { current: number; count: number }): number {
  return (current + 1) % count;
}

/** A stored value as a valid index, or `null` for anything else (missing, hand-edited, from an older version). */
export function parseHeroIndex({ raw, count }: { raw: string | null; count: number }): number | null {
  if (raw === null || !/^\d{1,3}$/.test(raw)) return null;
  const index = Number(raw);
  return index < count ? index : null;
}

/** One cookie's value from a `Cookie` header, or `null`. */
export function readCookieValue({ header, name }: { header: string | null; name: string }): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return null;
}

/**
 * What the server shows first and whether it must write the cookies. A request without the session cookie starts a new
 * session: the stored dog advances by one (the first visit ever has no stored dog and shows the first one). A request
 * that has it, such as a client-side navigation or a reload, shows the stored dog as it is.
 */
export function decideHeroOnLoad({ cookieHeader, count }: { cookieHeader: string | null; count: number }): {
  index: number;
  startsSession: boolean;
} {
  const stored = parseHeroIndex({ raw: readCookieValue({ header: cookieHeader, name: HERO_COOKIE }), count });
  const inSession = readCookieValue({ header: cookieHeader, name: HERO_SESSION_COOKIE }) !== null;

  if (inSession) return { index: stored ?? 0, startsSession: false };
  return { index: stored === null ? 0 : nextHeroIndex({ current: stored, count }), startsSession: true };
}

/** A `Set-Cookie` value for the hero cookies. `maxAge` is left out for the session cookie. */
export function serializeHeroCookie({ name, value, maxAge }: { name: string; value: string; maxAge?: number }): string {
  return `${name}=${value}; Path=/; SameSite=Lax${maxAge === undefined ? "" : `; Max-Age=${maxAge}`}`;
}
