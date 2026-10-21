/*===== Detail Motion =====*/
/**
 * The file's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load: each
 * class is set only on something that changed after a write (see `useHasChanged`, `useFreshRows`).
 *
 * - **A rung marked or unmarked** (`dd-stamp`): its new mark is pressed in, landing large and settling (`dd-press`: the
 *   dog tag's `tag-stamp` gives a 28px disc only a 2px swell, too little to see where the mark changed).
 * - **Evaluated** (`dd-stamp-late`): the stamp lands the same way, a beat later, once the dialog has faded out.
 * - **A certificate issued** (`dd-press`): its number is pressed onto the row, landing large and settling, after the
 *   dialog's 100ms fade; a revoked one's chip is stamped (`dd-stamp-late`).
 * - **A session written** rises in (the shared `answer-in`); **a session corrected** flashes once (`dd-flash`, an ink
 *   wash over the row that fades out).
 *
 * Reduced motion: none of it plays; the flash's wash is not even drawn.
 */
export function DetailMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .dd-stamp { animation: dd-press .32s var(--ease-silk) both; }
        .dd-stamp-late { animation: tag-stamp .32s var(--ease-silk) .12s both; }
        .dd-press { animation: dd-press .36s var(--ease-silk) .12s both; }
        .dd-flash { animation: dd-flash 1.2s var(--ease-silk-in-out) .1s both; }
      }
      @media (prefers-reduced-motion: reduce) {
        .dd-flash { display: none; }
      }
      @keyframes dd-press {
        from { transform: scale(1.45); opacity: 0; }
        55% { opacity: 1; }
        to { transform: none; opacity: 1; }
      }
      @keyframes dd-flash {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `}</style>
  );
}
