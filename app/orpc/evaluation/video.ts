import { EVALUATION_VIDEO_FORMATS, type EvaluationVideoFormat } from "~/orpc/evaluation/constants";

/*===== Video Format =====*/
// Phone videos are ISO base media files: the first box is `ftyp`, whose major brand says what the file is. The brand is
// read from the bytes themselves, never from the file name or `Content-Type`, which the sender controls.

/** `qt  ` is QuickTime, the iPhone's .mov. */
const MOV_BRANDS = ["qt  "];

/**
 * Brands of the MPEG-4 family that phones and cameras write: `isom` and `iso2`..`iso9`, `mp41`/`mp42`, `avc1`, `M4V `,
 * the 3GPP ones some Android phones use, and `dash`. The photo brands (`heic`, `mif1`, `avif`) are not in it, so a photo
 * with a video's extension is refused.
 */
const MP4_BRAND = /^(iso[m2-9]|mp4[12]|avc1|M4V |3gp.|3g2.|dash)/;

/** How many leading bytes `detectVideoFormat` needs. */
export const VIDEO_SNIFF_BYTES = 12;

/**
 * Reads a video's format from its first bytes.
 *
 * @returns `mp4` or `mov`; null when the file isn't one of them (another format, a photo, or not a video at all).
 */
export function detectVideoFormat(head: Uint8Array): EvaluationVideoFormat | null {
  if (head.length < VIDEO_SNIFF_BYTES) return null;

  const text = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (text(4, 8) !== "ftyp") return null;

  const brand = text(8, 12);
  if (MOV_BRANDS.includes(brand)) return "mov";
  return MP4_BRAND.test(brand) ? "mp4" : null;
}

/**
 * Narrows the stored format text.
 *
 * @throws When it isn't a format the pipeline writes: corrupted data that should surface instead of a key or a player
 * pointed at the wrong type.
 */
export function parseVideoFormat(value: string): EvaluationVideoFormat {
  const format = EVALUATION_VIDEO_FORMATS.find((candidate) => candidate === value);
  if (!format) throw new Error(`Unknown video format: ${value}`);
  return format;
}
