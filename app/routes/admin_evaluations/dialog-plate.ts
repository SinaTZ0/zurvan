import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Dialog Plate =====*/
/**
 * The two answer dialogs drawn as the Admin's paper, as the Payments dialogs are (copied, since slices don't share): a
 * grained, rounder popover with room for the form. Only the surface changes; focus, locking and closing are the shared
 * components' own.
 */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band; it matches `DIALOG_PLATE`'s padding. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";
