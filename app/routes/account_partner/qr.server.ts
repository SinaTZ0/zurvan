import { buildQr, type Qr } from "~/lib/qr.server";

/*===== Referral QR =====*/
export type ReferralQr = Qr;

/** The partner's referral link as a QR code (the generic encoder is shared with the dogs' file cards). */
export function buildReferralQr({ link }: { link: string }): ReferralQr {
  return buildQr({ text: link });
}
