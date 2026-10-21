/*===== Surfaces =====*/
// The form's own class strings, beside the shared `ADMIN_PLATE`, `ADMIN_HAIRLINE` and `ADMIN_TEAR`. Copied from the
// Courses page (`admin_courses/surfaces.ts`), since a slice never imports another slice.

/**
 * The quieter button in ink: an outline without the card fill and the gold-tinted border, so on a plate it reads as a
 * pencil line, not a second main button.
 */
export const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";
