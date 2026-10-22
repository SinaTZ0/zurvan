import { parseCookie, stringifySetCookie } from "cookie";
import { and, asc, eq } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { partner, partnerLead } from "~/db/schema";
import { env } from "~/env.server";
import { resolvePublicOrigin } from "~/lib/public-origin";

/*===== Referral Cookie =====*/
// A partner's link or QR code lands on the home page with `?ref=<code>`. The code is kept for 30 days so a visitor
// who browses first and signs up later is still attributed (docs/app-spec.md, F7). Signup reads it; whether
// the code belongs to an active partner is checked there, not here.
const REFERRAL_COOKIE_NAME = "zurvan_ref";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// Codes are short and URL-safe; anything else is a mangled link and isn't worth storing.
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

/** A cookie to set, in the shape both `stringifySetCookie` and TanStack Start's `setCookie(name, value, options)` take. */
export type ReferralCookie = {
  name: string;
  value: string;
  options: { maxAge: number; httpOnly: true; sameSite: "lax"; secure: boolean; path: "/" };
};

/**
 * The cookie that remembers the referral code in the request URL.
 *
 * `Secure` only when the visitor came over HTTPS: the site is also served over plain HTTP on a bare IP (`HTTP_IP`),
 * where a secure cookie would never come back.
 *
 * @returns The cookie, or `null` when the URL has no valid `ref` code.
 */
export function referralCookie({
  requestUrl,
  headers,
}: {
  requestUrl: string;
  headers: Headers;
}): ReferralCookie | null {
  const code = new URL(requestUrl).searchParams.get("ref")?.trim();
  if (!code || !REFERRAL_CODE_PATTERN.test(code)) return null;

  const secure =
    env.NODE_ENV === "production" &&
    resolvePublicOrigin(headers, env.BETTER_AUTH_URL, env.HTTP_IP).startsWith("https:");

  return {
    name: REFERRAL_COOKIE_NAME,
    value: encodeReferralCode(code),
    options: { maxAge: REFERRAL_COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", secure, path: "/" },
  };
}

/** The `Set-Cookie` header value for a referral cookie. */
export function serializeReferralCookie({ name, value, options }: ReferralCookie): string {
  return stringifySetCookie({ name, value, ...options });
}

/** Reads the remembered referral code from a request's headers, for signup attribution. */
export function readReferralCode(headers: Headers): string | null {
  const value = parseCookie(headers.get("Cookie") ?? "")[REFERRAL_COOKIE_NAME];
  return value ? decodeReferralCode(value) : null;
}

/*------ Value Encoding ------*/
// The value is the code as a JSON string in base64, which is what React Router's unsigned `createCookie` wrote before,
// so cookies already in visitors' browsers keep working. Codes are ASCII (`REFERRAL_CODE_PATTERN`), so `btoa` is safe.
function encodeReferralCode(code: string): string {
  return btoa(JSON.stringify(code));
}

function decodeReferralCode(value: string): string | null {
  try {
    const decoded: unknown = JSON.parse(atob(value));
    return typeof decoded === "string" ? decoded : null;
  } catch {
    return null;
  }
}

/*===== Attribution =====*/
/**
 * F7: the partner a new customer is attributed to, permanently, when they register.
 *
 * - A referral link (the code in the cookie) wins over a phone lead.
 * - If several partners entered the same phone number, the earliest lead wins.
 * - An inactive partner's link and leads attribute no one.
 *
 * @returns The partner's user id, or null for a customer nobody brought in.
 */
export async function findPartnerForNewCustomer({
  db,
  referralCode,
  phoneNumber,
}: {
  db: DatabaseOrTransaction;
  referralCode: string | null;
  phoneNumber: string | null;
}): Promise<string | null> {
  if (referralCode) {
    const [byLink] = await db
      .select({ userId: partner.userId })
      .from(partner)
      .where(and(eq(partner.code, referralCode), eq(partner.isActive, true)));
    if (byLink) return byLink.userId;
  }

  if (!phoneNumber) return null;
  const [byLead] = await db
    .select({ userId: partner.userId })
    .from(partnerLead)
    .innerJoin(partner, eq(partnerLead.partnerId, partner.userId))
    .where(and(eq(partnerLead.phoneNumber, phoneNumber), eq(partner.isActive, true)))
    .orderBy(asc(partnerLead.createdAt), asc(partnerLead.id))
    .limit(1);
  return byLead?.userId ?? null;
}
