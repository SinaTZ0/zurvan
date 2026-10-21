import { env } from "~/env.server";
import { logbookPath } from "~/lib/dog-file";
import type { QrLink } from "~/lib/qr";
import { buildQr } from "~/lib/qr.server";

/*===== Dog File Card =====*/
/** What the owner's and the Admin's pages show for a dog's file: the public address of its record, and that address as a QR code. */
export function buildDogFileCard({ fileNumber }: { fileNumber: string }): QrLink {
  const link = `${env.BETTER_AUTH_URL.replace(/\/$/, "")}${logbookPath(fileNumber)}`;
  return { link, qr: buildQr({ text: link }) };
}
