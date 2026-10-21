/*===== Constants =====*/
/**
 * How long an answered row stays after the dialog has closed: the stamp, a short hold, then the fold. The page removes
 * the row's copy after this; the keyframes below end a little before it.
 */
export const LEAVE_MS = 800;

/*===== Page Motion =====*/
/**
 * The queue's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it only
 * answers him:
 *
 * - **A request answered in «در انتظار»** (`ev-leaving`): its buttons and its chip fade (`ev-out`), the answer is
 *   stamped where he pressed it (`ev-stamp`, the shared `slip-stamp`; on a phone, where the chip was), «رد شد» also
 *   dims the row (`ev-dim`), it holds, then the row folds away (`ev-fold`: its row collapses from `1fr` to `0fr` as it
 *   fades). About 0.75s in all. A day whose last request left folds as a whole, its label with it.
 * - **A status that changed under a row or in the drawer** (`ev-chip-stamp`, the shared `tag-stamp`, slowed a little
 *   so it reads on a small chip): «همه», where the answered row stays, and the drawer, which stays open.
 * - **A count that changed** pops inside `AdminFilterPills` itself.
 * - **A filter change:** the rows rise in, staggered (the shared `answer-in`, set by the page).
 *
 * The delays start at 0.1s so the dialog's 100ms fade-out is over before the stamp lands. Under reduced motion a
 * leaving row is simply not there (the page doesn't even keep its copy), and nothing else moves.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ev-fold { animation: ev-fold .3s var(--ease-silk-in-out) .45s both; }
        .ev-out { animation: ev-out .14s ease-out .06s both; }
        .ev-stamp { animation: slip-stamp .32s var(--ease-silk) .1s both; }
        .ev-dim { animation: ev-dim .25s ease-out .1s both; }
        .ev-chip-stamp { animation: tag-stamp .32s var(--ease-silk) .12s both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .ev-leaving { display: none; }
      }
      @keyframes ev-fold {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
      @keyframes ev-out {
        to { opacity: 0; }
      }
      @keyframes ev-dim {
        to { opacity: .45; }
      }
    `}</style>
  );
}
