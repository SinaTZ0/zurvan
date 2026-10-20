import { cn } from "cn";

/*===== Shared Parts =====*/
// Small pieces every poster section reuses. The look is flat colour, hard edges and one printed texture, so nothing
// here has a radius or a soft shadow.

/** Poster headline face: Lalezar is heavy and geometric enough to read as lettering on a screen-print. */
export const POSTER_FONT = "font-['Lalezar']";

/** Hard focus ring that works on fawn, black and newsprint alike (black ring with a paper gap would vanish on black). */
export const FOCUS_RING =
  "outline-none focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-[var(--sy-red)]";

// Paper grain: SVG turbulence, multiplied over the flat field so the print looks inked, not rendered. A data URI keeps
// the preview free of extra files.
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Print grain laid over a positioned parent. Decorative. */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply", className)}
      style={{ backgroundImage: GRAIN }}
    />
  );
}

/** The red rubber stamp. Used once, on the free evaluation, so it keeps its weight. */
export function Stamp({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        POSTER_FONT,
        "inline-block -rotate-[8deg] border-[5px] border-[var(--sy-red)] px-4 pt-1 pb-0 text-4xl leading-tight text-[var(--sy-red)] mix-blend-multiply select-none sm:text-5xl",
        className,
      )}
      style={{ boxShadow: "inset 0 0 0 3px var(--sy-paper), inset 0 0 0 5px var(--sy-red)" }}
    >
      {children}
    </span>
  );
}

/** A stamped label: Saye's rare spoken line, printed on the poster instead of a bubble. */
export function SayeLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        POSTER_FONT,
        "inline-block border-y-[3px] border-current py-1 text-xl leading-snug sm:text-2xl",
        className,
      )}
    >
      {children}
    </p>
  );
}
