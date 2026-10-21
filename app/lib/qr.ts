import { z } from "zod";

/*===== QR Codes =====*/
// Browser-safe: the shape procedures answer with. The encoder itself is server-only (`qr.server.ts`), so the client
// never ships it.

export const qrSchema = z.object({
  /** Side length in modules, quiet zone included: the SVG's `viewBox` is `0 0 size size`. */
  size: z.number().int(),
  /** One SVG path with a square per dark module, so the whole code is a single element in the page and in the PNG. */
  path: z.string(),
});

export type Qr = z.infer<typeof qrSchema>;

/** A public address and the same address as a QR code: a dog's file, a certificate, a partner's referral link. */
export const qrLinkSchema = z.object({ link: z.string(), qr: qrSchema });

export type QrLink = z.infer<typeof qrLinkSchema>;
