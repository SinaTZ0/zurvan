/*===== Chalk Defs =====*/
// The road drawn as a chalk trail, the technique of the home page's steps trail copied into this slice (a route never
// imports from another route). Stacked, the trail is a tiled pattern (in px, so it never stretches) laid in one
// straight segment per gap between stops. The pattern and the roughening filter are defined once here; the svg holding
// them is sized to nothing but not `display: none`, which would stop Chrome painting them. A pattern's strokes take
// `currentColor` from where the pattern is defined, not where it's used, so the trail is the ink colour the road's
// section inherits, faded by opacity where it is used.

/** Defines the chalk filter and the dashed pattern once for the board; render it first inside the board's section. */
export function ChalkDefs() {
  return (
    <svg aria-hidden className="absolute size-0">
      <defs>
        <filter id="hp-trail-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>
        {/* A dashed, slightly wavering line along y = 8; the upright copy turns it a quarter, onto x = 8. */}
        <pattern id="hp-trail" width="64" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </pattern>
        <pattern id="hp-trail-down" href="#hp-trail" patternTransform="rotate(90) translate(0 -16)" />
      </defs>
    </svg>
  );
}

/*===== Trail Segment =====*/
/** The straight chalk line from one stop down to the next, when the stops stack. Positioned by the caller. */
export function TrailSegment({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className}>
      <rect width="100%" height="100%" fill="url(#hp-trail-down)" filter="url(#hp-trail-chalk)" />
    </svg>
  );
}

/*===== Winding Trail =====*/
// Wide, the stops zig-zag (2 and 4 sit 2.5rem lower) and one path winds through their centres. The viewBox is 1000 wide,
// stretched to the row, and 104 tall at 1:1 (the svg is 6.5rem). The five columns are equal with no gap, so the centres
// sit at x 900/700/500/300/100 at every width, whatever the board's size. The x axis is physical: the first stop is the
// rightmost, because the page reads right to left. The path's ends are under the stops' rings, which paint over it.
const WINDING_PATH = "M900 32C840 30 770 72 700 72S570 32 500 32S370 72 300 72S170 32 100 32";

/** The roughened dashed chalk path through the five stop centres. Shown from `md`, where the stops sit in one row. */
export function WindingTrail() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1000 104"
      preserveAspectRatio="none"
      className="absolute inset-x-0 top-0 hidden h-[6.5rem] w-full overflow-visible text-foreground opacity-55 md:block"
    >
      <path
        d={WINDING_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeDasharray="20 11"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        filter="url(#hp-trail-chalk)"
      />
    </svg>
  );
}

/*===== Sketched Edge =====*/
/**
 * The board's edge drawn twice in chalk, the second pass a little off and broken, the way a chalk outline goes over
 * itself. It traces the board's own rounded box, so the dog's paws still land on it.
 */
export function SketchedEdge() {
  const box = { width: "calc(100% - 2px)", height: "calc(100% - 2px)" };
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-foreground">
      <g fill="none" stroke="currentColor" strokeLinecap="round" filter="url(#hp-trail-chalk)">
        <rect x="1" y="1" rx="32" style={box} strokeWidth={2.2} opacity={0.75} />
        <rect x="3" y="-1" rx="34" style={box} strokeWidth={1.2} strokeDasharray="140 18 60 26 220 14" opacity={0.35} />
      </g>
    </svg>
  );
}
