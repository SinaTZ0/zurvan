import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Surfaces =====*/
// The list's own class strings, beside the shared `ADMIN_PLATE`, `ADMIN_HAIRLINE` and `ADMIN_TEAR`. The dialog and ink
// ones are copied from Courses (`admin_courses/surfaces.ts`), since a slice never imports another slice.

/** A dialog drawn as the plate's paper: grained, rounder, with room for its words. */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";

/** The quieter button in ink: an outline without the card fill, so on a plate it reads as a pencil line. */
export const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/*===== Row Tracks =====*/
/**
 * The list's grid, shared by the column head and every row so the columns line up down the plate.
 *
 * - **Phones:** the cover beside the title and its facts; the buttons take the full width under them.
 * - **From `md`:** the cover, the text, then the buttons at the end, over two lines.
 * - **From `xl`:** one line: cover, the post, its date, the buttons.
 */
export const ROW_COLUMNS = cn(
  "grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3",
  "[grid-template-areas:'cover_text'_'acts_acts']",
  "md:grid-cols-[6rem_minmax(0,1fr)_auto] md:gap-x-4",
  "md:[grid-template-areas:'cover_text_acts']",
  "xl:grid-cols-[6.5rem_minmax(0,1fr)_9rem_auto] xl:gap-x-5",
  "xl:[grid-template-areas:'cover_text_date_acts']",
);

/** The rows' side padding, the same on the head and the rows. */
export const ROW_PADDING = "px-3 sm:px-4 xl:px-5";
