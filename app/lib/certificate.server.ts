import { env } from "~/env.server";
import { certificatePath } from "~/lib/certificate";
import type { QrLink } from "~/lib/qr";
import { buildQr } from "~/lib/qr.server";

/*===== Certificate Card =====*/
/** What the owner's page shows for a certificate: the public address that verifies it, and that address as a QR code. */
export function buildCertificateCard({ number }: { number: string }): QrLink {
  const link = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}${certificatePath(number)}`;
  return { link, qr: buildQr({ text: link }) };
}
