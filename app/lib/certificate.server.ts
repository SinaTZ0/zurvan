import { env } from "~/env.server";
import { certificatePath } from "~/lib/certificate";
import { buildQr, type Qr } from "~/lib/qr.server";

/*===== Certificate Card =====*/
/** What the owner's page shows for a certificate: the public address that verifies it, and that address as a QR code. */
export function buildCertificateCard({ number }: { number: string }): { link: string; qr: Qr } {
  const link = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}${certificatePath(number)}`;
  return { link, qr: buildQr({ text: link }) };
}
