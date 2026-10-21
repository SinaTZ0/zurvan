/*===== Payments Motion =====*/
/**
 * The ledger's own motion, one `<style>` for the slice. Nothing moves on load: everything here answers something the
 * Admin did or something that changed under him.
 *
 * - **A filter or a page:** the first six slips rise in one after another (the shared `answer-in` with
 *   `--answer-delay`, set by the page).
 * - **A refund recorded:** its row rises in (`answer-in`) and «قابل بازپرداخت» pops (`answer-pop`, keyed by value).
 * - **A refund answered:** its chip is pressed in (`pm-stamp`, the dog tag's `tag-stamp`, slowed a little so it reads
 *   on a small chip).
 * - **The last flagged item resolved:** the flag fades and folds its height away (`pm-leave`), so the list moves up
 *   once instead of jumping. Under reduced motion the leaving flag is simply hidden.
 */
export function PaymentsMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .pm-stamp { animation: tag-stamp .32s var(--ease-silk) both; }
        .pm-leave { animation: pm-leave .5s var(--ease-silk-in-out) both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .pm-leave { display: none; }
      }
      @keyframes pm-leave {
        from { grid-template-rows: 1fr; opacity: 1; }
        to { grid-template-rows: 0fr; opacity: 0; }
      }
    `}</style>
  );
}
