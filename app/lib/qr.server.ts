import { encode } from "uqr";

/*===== QR Codes =====*/
/** Empty modules around the code. The spec asks for four; a printed card can't crop them, so they are part of the path. */
const QUIET_ZONE = 4;

export type Qr = {
  /** Side length in modules, quiet zone included: the SVG's `viewBox` is `0 0 size size`. */
  size: number;
  /** One SVG path with a square per dark module, so the whole code is a single element in the page and in the PNG. */
  path: string;
};

/**
 * Encodes text (a link) as a QR code the browser can draw. Built on the server so the client never ships a QR encoder.
 * Medium error correction survives a scuffed printed card and keeps the code dense enough to scan from a phone at arm's
 * length.
 *
 * @returns The module grid as one SVG path; `uqr` marks dark modules as `true`.
 */
export function buildQr({ text }: { text: string }): Qr {
  const { data, size } = encode(text, { ecc: "M" });

  let path = "";
  data.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    });
  });

  return { size: size + QUIET_ZONE * 2, path };
}
