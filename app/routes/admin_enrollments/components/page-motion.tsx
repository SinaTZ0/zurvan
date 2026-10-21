/*===== Constants =====*/
/**
 * How long a closed line stays after the dialog has closed: the stamp (or the strike), a short hold, then the fold.
 * The page removes the line's copy after this; the keyframes below end a little before it.
 */
export const LEAVE_MS = 900;

/*===== Page Motion =====*/
/**
 * The call sheet's motion, one `<style>` for the slice (the shared answers live in app.css). It only answers him:
 *
 * - **A line closed with «تمام شد»** (`ae-leave-complete`): its buttons fade, the «تمام شد» stamp lands on their place
 *   (the shared `slip-stamp`), holds, then the line folds away (`ae-fold`: its row collapses from `1fr` to `0fr` as it
 *   fades). About 0.8s in all.
 * - **A line closed with «لغو»** (`ae-leave-cancel`): it dims, a strike is drawn through the course from the start side,
 *   then it folds the same way.
 * - **A block whose last line left** folds as a whole (`ae-fold` on the block), and its lines don't fold on their own.
 * - **In «همه»** the closed line stays: its new chip is pressed in (`ae-chip-stamp`, the shared `tag-stamp`).
 * - **A count that changed** pops inside `AdminFilterPills` itself.
 * - **A filter or page change:** the blocks rise in, staggered (the shared `answer-in`, set by the page).
 *
 * The delays start at 0.1s so the dialog's 100ms fade-out is over before the stamp lands. Under reduced motion a
 * leaving line is simply not there (the page doesn't even keep its copy), and nothing else moves.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ae-fold { animation: ae-fold .3s cubic-bezier(.65,0,.35,1) .5s both; }
        .ae-buttons-out { animation: ae-out .14s ease-out .06s both; }
        .ae-stamp { animation: slip-stamp .32s cubic-bezier(.22,1,.36,1) .1s both; }
        .ae-dim { animation: ae-dim .25s ease-out .1s both; }
        /* Drawn from the start side; the page is RTL, so the start is the physical right. */
        .ae-strike { transform-origin: right center; animation: ae-strike .3s cubic-bezier(.22,1,.36,1) .12s both; }
        .ae-chip-stamp { animation: tag-stamp .22s cubic-bezier(.22,1,.36,1) .12s both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ae-leaving { display: none; }
      }
      @keyframes ae-fold {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
      @keyframes ae-out {
        to { opacity: 0; }
      }
      @keyframes ae-dim {
        to { opacity: .45; }
      }
      @keyframes ae-strike {
        from { transform: scaleX(0); }
        to { transform: scaleX(1); }
      }
    `}</style>
  );
}
