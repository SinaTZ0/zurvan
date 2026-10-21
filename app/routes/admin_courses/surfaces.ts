import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Surfaces =====*/
// The shelf's own class strings, beside the shared `ADMIN_PLATE`, `ADMIN_HAIRLINE` and `ADMIN_TEAR`. The dialog ones are
// copied from Admin Batch 1 (`admin_payments/dialog-plate.ts`), since a slice never imports another slice.

/** A dialog drawn as the plate's paper: grained, rounder, with room for its words. */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band; it matches `DIALOG_PLATE`'s padding. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";

/**
 * The quieter button in ink (Dog Detail's): an outline without the card fill and the gold-tinted border, so on a plate
 * it reads as a pencil line, not a second main button.
 */
export const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/*===== Shelf Tracks =====*/
/**
 * The shelf's grid, shared by the column head and every row so the columns line up down the plate.
 *
 * - **Phones:** the position column at the start runs the row's full height (the number over the two arrows); the
 *   cover sits beside the title and the price; the facts and the two buttons take the full width under them.
 * - **From `md`:** the position, the cover and the text keep their tracks; the price sits over the buttons at the end.
 * - **From `xl`:** one line: position, cover, the course, the price, the enrollments, the buttons.
 */
export const SHELF_COLUMNS = cn(
  "grid grid-cols-[2.5rem_5rem_minmax(0,1fr)] gap-x-3",
  "[grid-template-areas:'pos_cover_head'_'pos_cover_money'_'pos_facts_facts'_'pos_acts_acts']",
  "md:grid-cols-[auto_5.5rem_minmax(0,1fr)_auto] md:gap-x-4",
  "md:[grid-template-areas:'pos_cover_text_money'_'pos_cover_text_acts']",
  "xl:grid-cols-[auto_6rem_minmax(0,1fr)_8.5rem_6.5rem_11.5rem] xl:gap-x-5",
  "xl:[grid-template-areas:'pos_cover_text_price_enr_acts']",
);

/** The shelf's side padding, the same on the head and the rows. */
export const SHELF_PADDING = "px-3 sm:px-4 xl:px-5";
