/*===== Column =====*/
/** The home page's column, so the content lines up with the header and the footer. */
export const COLUMN = "mx-auto max-w-6xl px-4 md:px-8";

/*===== Plate =====*/
/** A grained plate on the paper, a step down from it, as every Batch 4–6 section. Padding is the caller's. */
export const PLATE =
  "rounded-4xl border border-border/60 bg-sunken paper-grain shadow-[0_24px_48px_-28px_rgb(0_0_0/0.9)]";

/** A pool of warm light where a dog stands (the playbook's 0.08 alpha, never more). */
export const WARM_LIGHT = "bg-[radial-gradient(ellipse_48%_55%_at_50%_80%,rgb(255_194_26/0.08),transparent)]";

/** Both ends of a ground strip fade into the paper. */
export const STRIP_FADE = "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]";
