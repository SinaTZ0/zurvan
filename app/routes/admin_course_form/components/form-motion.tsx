/*===== Form Motion =====*/
/**
 * The course form's motion, one `<style>` for the slice (the shared answers live in app.css). Nothing moves on load;
 * it only answers him:
 *
 * - **The card** answers a new title, price or cover with a quick pop (`acf-card-pop`, the shared `answer-pop` made
 *   short and shallow so a whole card doesn't jump), once the typing rests (`course-preview.tsx`).
 * - **A message** under a field rises in (the shared `answer-in`, `field-parts.tsx`), and so does the save bar's.
 * - **An uploaded photo** is pressed into its print (`motion-safe:animate-tag-stamp`, `cover-section.tsx`).
 * - **A plate with a message** gets its destructive hairline with a colour transition, and the contents list's mark
 *   pops in beside its name.
 *
 * Under reduced motion nothing here moves: the card simply shows what is typed.
 */
export function FormMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .acf-card-pop { animation: acf-card-pop .34s cubic-bezier(.3,1.45,.5,1) both; }
      }
      @keyframes acf-card-pop {
        from { transform: scale(.96); opacity: .6; }
        to { transform: none; opacity: 1; }
      }
    `}</style>
  );
}
