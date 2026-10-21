/*===== Chalk Defs =====*/
// The steps drawn as a chalk path, the technique of the home page's steps trail copied into this slice (a route never
// imports from another route). The roughening filter and the dashed pattern are defined once here; the svg holding them
// is sized to nothing but not `display: none`, which would stop Chrome painting them. A pattern's strokes take
// `currentColor` from where the pattern is defined, not where it's used, so the path is the ink colour the section
// inherits, faded by opacity where it is used.

/** Defines the chalk filter and the dashed pattern once for the board; render it first inside the board's section. */
export function ChalkDefs() {
  return (
    <svg aria-hidden className="absolute size-0">
      <defs>
        <filter id="jp-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>
        {/* A dashed, slightly wavering line along y = 8; the upright copy turns it a quarter, onto x = 8. */}
        <pattern id="jp-dash" width="64" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </pattern>
        <pattern id="jp-dash-down" href="#jp-dash" patternTransform="rotate(90) translate(0 -16)" />
      </defs>
    </svg>
  );
}

/*===== Path Line =====*/
/**
 * One straight run of the chalk path: across (`direction="across"`, the steps in a row) or down (the steps stacked).
 * Positioned and sized by the caller; the page's CSS draws it on scroll (`jp-draw-across`, `jp-draw-down`).
 */
export function PathLine({ direction, className }: { direction: "across" | "down"; className?: string }) {
  return (
    <svg aria-hidden className={className}>
      <rect
        width="100%"
        height="100%"
        fill={direction === "across" ? "url(#jp-dash)" : "url(#jp-dash-down)"}
        filter="url(#jp-chalk)"
      />
    </svg>
  );
}

/*===== Sketched Edge =====*/
/**
 * The board's edge drawn twice in chalk, the second pass a little off and broken, the way a chalk outline goes over
 * itself. It traces the board's own rounded box, so a dog's paws still land on it.
 */
export function SketchedEdge() {
  const box = { width: "calc(100% - 2px)", height: "calc(100% - 2px)" };
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full overflow-visible text-foreground">
      <g fill="none" stroke="currentColor" strokeLinecap="round" filter="url(#jp-chalk)">
        <rect x="1" y="1" rx="32" style={box} strokeWidth={2.2} opacity={0.75} />
        <rect x="3" y="-1" rx="34" style={box} strokeWidth={1.2} strokeDasharray="140 18 60 26 220 14" opacity={0.35} />
      </g>
    </svg>
  );
}
