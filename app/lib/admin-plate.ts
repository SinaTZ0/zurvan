/*===== Admin Plate =====*/
/**
 * The one surface of the Admin pages: the customer pages' grained plate made quieter and tighter (a smaller radius, a
 * short shadow), since the Admin area has the site's style but not its story. Padding is the caller's; rows inside it
 * are divided by ink hairlines (`ADMIN_HAIRLINE`).
 */
export const ADMIN_PLATE =
  "rounded-3xl border border-border/60 bg-sunken paper-grain shadow-[0_16px_32px_-24px_rgb(0_0_0/0.9)]";

/** The ink hairline between the rows of a plate (`divide-y` or `border-t`), never the gold `border`. */
export const ADMIN_HAIRLINE = "border-foreground/10 divide-foreground/10";

/** The slip's tear: a dashed ink line, between a stub and its lines or between two groups. */
export const ADMIN_TEAR = "border-dashed border-foreground/20";
