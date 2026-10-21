/*===== Slip Marks =====*/
// The slip's drawing vocabulary on the ledger, shared by the slips, the torn line and the flag.

/**
 * A half-round bite out of the slip's edge where the tear line meets it: a disc of the page's own paper over the edge,
 * the part outside the slip clipped away by the slip's `overflow-hidden`. Its faint ring draws the bite's rim.
 */
export const NOTCH =
  "pointer-events-none absolute size-5 rounded-full border border-foreground/10 bg-background paper-grain";

/**
 * The torn piece: the bottom edge is cut into small teeth by a mask (a row of 0.75rem tiles, each with its two bottom
 * corners masked off), so the box reads as paper torn off the slip. It cuts the bottom border too, so a torn box has no
 * bottom border of its own and keeps a little extra bottom padding for the teeth (0.375rem deep).
 */
export const TORN_EDGE =
  "[mask:conic-gradient(from_-45deg_at_bottom,#0000,#000_1deg_89deg,#0000_90deg)_50%/0.75rem_100%]";

/** The torn piece's outline and tint: dashed destructive, never a filled alarm. Pair with `TORN_EDGE`. */
export const TORN_PIECE = "border border-b-0 border-dashed border-destructive/55 bg-destructive/[0.07]";
