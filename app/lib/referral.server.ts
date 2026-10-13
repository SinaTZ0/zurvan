import { and, asc, eq } from "drizzle-orm";
import { createCookie } from "react-router";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { partner, partnerLead } from "~/db/schema";
import { env } from "~/env.server";

/*===== Referral Cookie =====*/
// A partner's link or QR code lands on the home page with `?ref=<code>`. The code is kept for 30 days so a visitor
// who browses first and signs up later is still attributed (docs/app-spec.md, F7). Signup reads it; whether
// the code belongs to an active partner is checked there, not here.
const referralCookie = createCookie("zurvan_ref", {
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  path: "/",
});

// Codes are short and URL-safe; anything else is a mangled link and isn't worth storing.
const REFERRAL_CODE_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

/**
 * Builds the `Set-Cookie` header that remembers the referral code in the request URL.
 *
 * @returns The header value, or `null` when the URL has no valid `ref` code.
 */
export async function referralCookieFromUrl(requestUrl: string): Promise<string | null> {
  const code = new URL(requestUrl).searchParams.get("ref")?.trim();
  if (!code || !REFERRAL_CODE_PATTERN.test(code)) return null;
  return referralCookie.serialize(code);
}

/** Reads the remembered referral code from a request's headers, for signup attribution. */
export async function readReferralCode(headers: Headers): Promise<string | null> {
  const value: unknown = await referralCookie.parse(headers.get("Cookie"));
  return typeof value === "string" ? value : null;
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
