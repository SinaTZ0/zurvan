/*===== Settings Motion =====*/
/**
 * The page's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it only
 * answers what he types and saves:
 *
 * - **A number typed:** each worked-out value in the live sentence pops (the shared `answer-pop`, in `PopText`).
 * - **A save:** «ذخیره شد» is stamped where «هنوز عوض نشده» was (`as-stamp`, the shared `slip-stamp`: it lands large
 *   and turned, then settles at its tilt).
 * - **An error** under the field, or the server's alert, rises in (the shared `answer-in`, keyed by its message).
 *
 * The stamp's tilt is set outside the media query: the keyframe ends on the same tilt, and under reduced motion the
 * stamp is simply there, already tilted.
 */
export function SettingsMotion() {
  return (
    <style>{`
      .as-stamp { transform: rotate(-9deg); }
      @media (prefers-reduced-motion: no-preference) {
        .as-stamp { animation: slip-stamp .32s var(--ease-silk) both; }
      }
    `}</style>
  );
}
