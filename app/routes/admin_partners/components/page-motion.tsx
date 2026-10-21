/*===== Constants =====*/
/**
 * How long a paid line stays after the dialog has closed: the stamp, a short hold, then the fold. The page removes the
 * line's copy after this; the keyframes below end a little before it.
 */
export const LEAVE_MS = 900;

/*===== Page Motion =====*/
/**
 * The pay sheet's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it
 * only answers him:
 *
 * - **A line paid** (`pp-leaving`): its button fades (`pp-out`), the «پرداخت شد» stamp lands where it was (`pp-stamp`,
 *   app.css's `slip-stamp`), holds, then the line folds away (`pp-fold`: its row collapses from `1fr` to `0fr` as it
 *   fades). The slip's sum and the pill's count pop to their new value as the stamp lands. About 0.85s in all.
 * - **A slip whose last line left** folds as a whole, and its lines only stamp, so the two folds don't fight.
 * - **A status that changed in the drawer or the roster** (`pp-chip-stamp`, the shared `tag-stamp`, slowed a little so
 *   it reads on a small chip): «غیرفعال», «فعال», a commission's «پرداخت شد».
 * - **An inactive row** eases into its dim, dashed look (a transition on the row itself).
 * - **«کپی شبا»** answers with a check that pops in (`answer-pop`) and turns back after two seconds.
 * - **A view change:** the slips or rows rise in, staggered (the shared `answer-in`, set by the page).
 *
 * The delays start at 0.1s so the dialog's 100ms fade-out is over before the stamp lands. Under reduced motion a paid
 * line is simply not there (the page doesn't even keep its copy), and nothing else moves.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .pp-fold { animation: pp-fold .3s var(--ease-silk-in-out) .5s both; }
        .pp-out { animation: pp-out .14s ease-out .06s both; }
        .pp-stamp { animation: slip-stamp .32s var(--ease-silk) .1s both; }
        .pp-chip-stamp { animation: tag-stamp .32s var(--ease-silk) .12s both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pp-leaving { display: none; }
      }
      @keyframes pp-fold {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
      @keyframes pp-out {
        to { opacity: 0; }
      }
    `}</style>
  );
}
