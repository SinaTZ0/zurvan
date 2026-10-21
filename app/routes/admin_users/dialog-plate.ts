import { cn } from "cn";

import { ADMIN_TEAR } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Dialog Plate =====*/
/**
 * The person's dialog and its block confirm drawn as the Admin's paper, as the Payments and Evaluations dialogs are
 * (copied, since slices don't share): a grained, rounder popover. Only the surface changes; focus, locking and closing
 * are the shared components' own.
 */
export const CONFIRM_PLATE = "rounded-3xl p-6 paper-grain shadow-[0_24px_60px_-16px_rgb(0_0_0/0.9)] ring-foreground/15";

/** A dialog's title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The confirm's buttons sit under the slip's tear (a dashed ink line) instead of on a grey band. */
export const CONFIRM_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";

/** A section of the person's dialog: the slip's tear above every one but the first. */
export const DIALOG_SECTION = cn("grid gap-3 border-t py-5 first:border-t-0 first:pt-0 last:pb-0", ADMIN_TEAR);
