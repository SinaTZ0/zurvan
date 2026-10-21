/*===== Constants =====*/
/**
 * How long a row that left the status pill stays after the dialog has closed: the frame and the chip answer, a short
 * hold, then the fold. The page removes the row's copy after this; the keyframes below end a little before it.
 */
export const LEAVE_MS = 1000;

/*===== Page Motion =====*/
/**
 * The roll's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it only
 * answers him:
 *
 * - **Blocked:** the row's dashed frame eases in and everything but the chip dims (Tailwind transitions on the row),
 *   and the «مسدود» chip is pressed in (`au-chip-stamp`, the shared `tag-stamp`, slowed a little so it reads on a
 *   small chip). **Opened again:** the frame fades out and the row brightens.
 * - **A saved name:** the row flashes once (`au-flash`), when he closes the dialog.
 * - **A row that left «فعال» or «مسدود»** (`au-leaving`): after its answer it folds away (`au-fold`: its row
 *   collapses from `1fr` to `0fr` as it fades).
 * - **A count that changed** pops inside `AdminFilterPills` and the result line.
 * - **A filter, search or page change:** the first rows rise in, staggered (the shared `answer-in`, set by the page).
 *
 * The delays start at 0.1s so the dialog's 100ms fade-out is over before anything lands. Under reduced motion a
 * leaving row is simply not there (the page doesn't even keep its copy), and nothing else moves.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .au-chip-stamp { animation: tag-stamp .32s cubic-bezier(.22,1,.36,1) .15s both; }
        .au-flash { animation: au-flash .9s ease-out .12s both; }
        .au-fold { animation: au-fold .3s cubic-bezier(.65,0,.35,1) .65s both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .au-leaving { display: none; }
      }
      @keyframes au-flash {
        0% { opacity: 0; }
        25% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes au-fold {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
    `}</style>
  );
}
