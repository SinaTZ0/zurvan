/*===== Dialog Plate =====*/
/**
 * The refund dialogs drawn as the ledger's paper: a grained, rounder popover with room for the form. Only the surface
 * changes; the dialogs' focus, locking and closing are the shared components' own.
 */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band; it matches `DIALOG_PLATE`'s padding. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";
