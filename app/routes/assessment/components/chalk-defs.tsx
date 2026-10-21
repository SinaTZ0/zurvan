/*===== Chalk =====*/
/**
 * Rendered once on the page: Course Detail's chalk trail defined again under `as-` ids (a filter that roughens lines
 * into chalk, a dashed wavering line as a tiled pattern in px so it never stretches, in gold and in ink, each with an
 * upright copy turned a quarter onto x = 8). The header's road, the line joining the form's numbered plates and the
 * receipt's road use them. The svg is sized to nothing but not `display: none`, which would stop Chrome painting what
 * uses it.
 */
export function ChalkDefs() {
  return (
    <svg aria-hidden className="absolute size-0">
      <defs>
        <filter id="as-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={2.5} />
        </filter>
        {(["gold", "ink"] as const).map((tone) => (
          <pattern key={tone} id={`as-trail-${tone}`} width="64" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M3 8.5C9 7.6 15 8.8 24 8M35 7.8C42 8.6 50 7.4 58 8.3"
              fill="none"
              style={{ stroke: tone === "gold" ? "var(--primary)" : "var(--foreground)" }}
              strokeWidth={2.4}
              strokeLinecap="round"
            />
          </pattern>
        ))}
        <pattern id="as-trail-gold-down" href="#as-trail-gold" patternTransform="rotate(90) translate(0 -16)" />
        <pattern id="as-trail-ink-down" href="#as-trail-ink" patternTransform="rotate(90) translate(0 -16)" />
      </defs>
    </svg>
  );
}

/*===== Fills =====*/
/** The walked part of a trail is gold, the part ahead faint ink. `down` for an upright segment. */
export const TRAIL_FILL = {
  walked: "[fill:url(#as-trail-gold)] opacity-80",
  ahead: "[fill:url(#as-trail-ink)] opacity-40",
  walkedDown: "[fill:url(#as-trail-gold-down)] opacity-80",
  aheadDown: "[fill:url(#as-trail-ink-down)] opacity-40",
} as const;
