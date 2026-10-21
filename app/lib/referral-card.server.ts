import { env } from "~/env.server";
import type { QrLink } from "~/lib/qr";
import { buildQr } from "~/lib/qr.server";

/*===== Referral Card =====*/
/** What a partner's own page shows: their referral link (`/?ref=<code>`) and that link as a QR code. */
export function buildReferralCard({ code }: { code: string }): QrLink {
  const link = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;
  return { link, qr: buildQr({ text: link }) };
}
