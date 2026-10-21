/*===== Surfaces =====*/
// The file's own class strings, beside the shared `ADMIN_PLATE`, `ADMIN_HAIRLINE` and `ADMIN_TEAR`. Copied from Admin
// Batch 1 (`admin_payments/dialog-plate.ts`) where noted, since a slice never imports another slice.

/** A dialog drawn as the plate's paper: grained, rounder, with room for its words (Batch 1's `DIALOG_PLATE`). */
export const DIALOG_PLATE = "rounded-3xl p-6 paper-grain sm:max-w-md";

/** A dialog's buttons under the slip's tear instead of on a grey band; matches `DIALOG_PLATE`'s padding. */
export const DIALOG_FOOTER = "-mx-6 -mb-6 rounded-b-3xl border-dashed border-foreground/15 bg-transparent px-6 py-4";

/** A dialog's title: Estedad, as the Admin pages' section heads. */
export const DIALOG_TITLE = "font-display text-xl leading-snug font-extrabold text-balance";

/**
 * The quieter button in ink: an outline button without the card fill and the gold-tinted border, so on a plate it
 * reads as a pencil line, not a second main button.
 */
export const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/** A text link in ink (the Admin pages keep gold for the work waiting for him). */
export const INK_LINK =
  "inline-flex h-10 w-fit shrink-0 items-center gap-1 rounded-sm text-sm font-bold text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors outline-none hover:decoration-foreground focus-visible:ring-3 focus-visible:ring-ring/50";

/** An empty section: one quiet line under its head, not a big empty plate. */
export const QUIET_LINE =
  "rounded-2xl border border-dashed border-foreground/15 px-4 py-3 text-sm text-pretty text-muted-foreground";

/*===== Sheets =====*/
/**
 * The edit and session sheets as the plate's paper: grained, a bottom sheet with a round top on phones, a side sheet
 * from the end on desktop. Their head and footer sit under and over the slip's tear; the body between them scrolls.
 */
export const SHEET_PLATE =
  "gap-0 p-0 paper-grain data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-md";

/** The sheet's head: its title and the dog's name, with the close button, over the tear. */
export const SHEET_HEAD = "flex items-center gap-3 border-b border-dashed border-foreground/20 px-5 py-4";

/** The sheet's title, in Estedad as the dialogs'. */
export const SHEET_TITLE = "truncate font-display text-xl font-extrabold";

/** The sheet's footer, held under the tear at the bottom while the fields scroll. */
export const SHEET_FOOTER = "flex flex-col gap-3 border-t border-dashed border-foreground/20 px-5 py-4";

/** A group of fields in a sheet's body; every group after the first opens with the tear. */
export const SHEET_GROUP =
  "flex flex-col gap-6 px-5 py-5 not-first:border-t not-first:border-dashed not-first:border-foreground/15";
