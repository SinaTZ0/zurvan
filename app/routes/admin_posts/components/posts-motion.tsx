/*===== Posts Motion =====*/
/**
 * The list's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it only
 * answers her:
 *
 * - **A filter change:** the rows rise in (the shared `answer-in`, staggered on the first few), and the pills' counts
 *   pop (`AdminFilterPills`).
 * - **Publish or unpublish:** the row's «پیش‌نویس» chip, or its «منتشر شد» line, is stamped (`ap-stamp`: it lands large
 *   and faint, then presses flat, as Courses' archived chip does).
 * - **A refused publish:** what's missing rises in under the row.
 *
 * Under reduced motion nothing here moves: the new state is simply there.
 */
export function PostsMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ap-stamp { animation: ap-stamp .34s var(--ease-silk) both; }
      }
      @keyframes ap-stamp {
        from { transform: scale(1.6); opacity: 0; }
        55% { opacity: 1; }
        to { transform: none; opacity: 1; }
      }
    `}</style>
  );
}
