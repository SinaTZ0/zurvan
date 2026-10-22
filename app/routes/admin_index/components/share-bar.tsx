import { cn } from "cn";

/*===== Fills =====*/
// The finished share is ivory at half strength, mixed into the plate's own colour rather than made transparent, so
// the dashed outline under it doesn't show through.
const FINISHED_FILL: React.CSSProperties = {
  backgroundColor: "color-mix(in oklab, var(--color-foreground) 50%, var(--color-sunken))",
};

/*===== Share Bar =====*/
/**
 * A bar split into in training (ivory), finished (ivory at half) and the rest (cancelled), each segment's length its
 * share of `scale`. Every segment is a full-width layer scaled from the start edge (`scaleX`), the finished one under
 * the active one, so a refetch slides each to its new share with a transform (`ov-seg`, page-motion.tsx). The app
 * is right-to-left only, so the start edge is the physical right (`origin-right`).
 *
 * - `strip`: the enrollments' strip; `scale` is the total, so the three shares fill it and the rest is the dashed
 *   cancelled outline.
 * - `thin`: a course's bar; `scale` is the busiest course's count, so courses compare, and the cancelled rest is a faint
 *   fill up to the course's own total.
 *
 * Decorative: the numbers beside it say the same in words.
 */
export function ShareBar({
  active,
  completed,
  total,
  scale,
  variant,
}: {
  active: number;
  completed: number;
  /** Everything counted, cancelled included. */
  total: number;
  /** What the full width stands for. */
  scale: number;
  variant: "strip" | "thin";
}) {
  const share = (value: number) => (scale > 0 ? Math.min(value / scale, 1) : 0);
  const segment = "ov-seg absolute inset-0 origin-right";

  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-full",
        variant === "strip" ? "h-3" : "h-1.5",
        total === 0 && "bg-foreground/[0.06]",
      )}
    >
      {total > 0 && (
        <>
          {/*------ The Cancelled Rest ------*/}
          {variant === "strip" ? (
            <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-foreground/45" />
          ) : (
            <span className={cn(segment, "bg-foreground/15")} style={{ transform: `scaleX(${share(total)})` }} />
          )}

          {/*------ Finished, Then Active Over It ------*/}
          <span className={segment} style={{ ...FINISHED_FILL, transform: `scaleX(${share(active + completed)})` }} />
          <span className={cn(segment, "bg-foreground")} style={{ transform: `scaleX(${share(active)})` }} />
        </>
      )}
    </div>
  );
}
