/*===== Courses Motion =====*/
/**
 * The shelf's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load; it only
 * answers him:
 *
 * - **A move** (↑ or ↓): the two rows swap places with a slide (`use-swap-slide.ts`, a FLIP in Web Animations, since
 *   the distance is only known once the new order is laid out), the row he moved lifted above the other, and both
 *   position numbers pop as they go (the shared `answer-pop`). A failed move slides back the
 *   same way.
 * - **Archive:** the row's dashed outline draws in and its content dims (`ac-fade`), and the «بایگانی‌شده» chip is
 *   stamped (`ac-stamp`: it lands large and faint, then presses flat, the dog tag's `tag-stamp` made bigger so it reads
 *   as a rubber stamp). **Restore:** the outline and the dim fade back out.
 * - **A count that changed** (the header's) pops, the shared `answer-pop`.
 *
 * The archive's delays start at 0.14s so the dialog's fade-out is over before the stamp lands. Under reduced motion
 * nothing here moves: the rows simply reorder, and the archived look is there at once.
 */
export function CoursesMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ac-fade { transition: opacity .3s var(--ease-silk) .14s; }
        .ac-stamp { animation: ac-stamp .34s var(--ease-silk) .14s both; }
      }
      @keyframes ac-stamp {
        from { transform: scale(1.6); opacity: 0; }
        55% { opacity: 1; }
        to { transform: none; opacity: 1; }
      }
    `}</style>
  );
}
