import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Dialog Plate =====*/
/**
 * The confirms drawn as the Admin's paper, as the Payments and Evaluations dialogs are (copied, since slices don't
 * share): a grained, rounder popover. Only the surface changes; focus, locking and closing are the shared components'.
 */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band; it matches `DIALOG_PLATE`'s padding. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";

/** The two sheets (the partner's file and «همکار تازه»): the same grained paper, from the end side or the bottom. */
export const SHEET_PLATE =
  "gap-0 border-foreground/10 paper-grain p-0 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-lg";
