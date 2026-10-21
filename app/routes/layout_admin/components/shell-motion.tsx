/*===== Shell Motion =====*/
/**
 * The shell's one answer of its own: on the page he just opened, the rail's (and the sheet's) gold mark grows in from
 * its middle (`admin-mark-grow`, 200ms, `ease-silk`). The badges pop with the shared `answer-pop` (in `NavBadge`) and the
 * sheet slides as the `Sheet` does. Nothing moves on load (`useHasNavigated`), and everything is off under reduced
 * motion, which shows the mark in place at once.
 */
export function ShellMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .admin-mark-grow { animation: admin-mark-grow 0.2s var(--ease-silk) both; }
      }
      @keyframes admin-mark-grow {
        from { transform: scaleY(0); }
        to { transform: none; }
      }
    `}</style>
  );
}
