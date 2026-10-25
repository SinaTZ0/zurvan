import { cn } from "cn";

import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Surfaces =====*/
// The form's own class strings, beside the shared `ADMIN_PLATE`, `ADMIN_HAIRLINE` and `ADMIN_TEAR`. Copied from the
// course form and Courses (`admin_course_form/surfaces.ts`, `admin_courses/surfaces.ts`), since a slice never imports
// another slice.

/** The quieter button in ink: an outline without the card fill, so on a plate it reads as a pencil line. */
export const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/** A dialog drawn as the plate's paper: grained, rounder, with room for its words. */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** The title in Estedad, as an Admin dialog's heading. */
export const DIALOG_TITLE = cn(DISPLAY_HEADING, "text-xl text-pretty");

/** The buttons sit under the slip's tear (a dashed ink line) instead of on a grey band. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";
