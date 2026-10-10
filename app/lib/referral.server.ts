import { createCookie } from "react-router";

import { env } from "~/env.server";

/*===== Referral Cookie =====*/
// A partner's link or QR code lands on the home page with `?ref=<code>`. The code is kept for 30 days so a visitor
// who browses first and signs up later is still attributed (docs/foundations-plan.md). Signup reads it; whether
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

/** Reads the remembered referral code, for signup attribution. */
export async function readReferralCode(request: Request): Promise<string | null> {
  const value: unknown = await referralCookie.parse(request.headers.get("Cookie"));
  return typeof value === "string" ? value : null;
}
