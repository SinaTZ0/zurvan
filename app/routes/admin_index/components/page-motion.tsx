/*===== Page Motion =====*/
/**
 * The Overview's only motion besides the numbers' pop (`PopNumber`) and the chevron's nudge (`TileChevron`): when a
 * revalidation changes the enrollments' or a course's shares, each segment of the strip slides to its new share. The
 * segments are `scaleX` transforms (`ov-seg`), so this is a transition on the transform, not a keyframe: the first
 * render already has the final shares and nothing moves on load. Off for reduced motion, where the new share is simply
 * there.
 */
export function PageMotion() {
  return (
    <style>{`
      @media (prefers-reduced-motion: no-preference) {
        .ov-seg { transition: transform .6s var(--ease-silk); }
      }
    `}</style>
  );
}
