import { cn } from "cn";

/*===== Stars =====*/
// More of the night than the shared `NightSky` draws (its moon and six faint crosses): small round stars scattered over
// the upper part of the tall desktop panel, some of which twinkle, plus a halo behind the moon and two chalk clouds that
// drift. Positions are shares of the panel and physical (it is a picture): `x` from the left, `y` from the top, all above
// the bubbles' band (about 34% down) so no star ends up at a bubble's edge. `size` is in px; `tw` is a negative animation
// delay in seconds, so the twinklers are never in step (absent: a steady star).
const STARS = [
  { x: 12, y: 24, size: 3, tw: -0.4 },
  { x: 24, y: 10, size: 2 },
  { x: 33, y: 19, size: 2, tw: -1.9 },
  { x: 44, y: 6, size: 3, tw: -2.6 },
  { x: 54, y: 23, size: 2 },
  { x: 63, y: 12, size: 2, tw: -0.9 },
  { x: 71, y: 28, size: 3 },
  { x: 79, y: 7, size: 2, tw: -3.2 },
  { x: 87, y: 20, size: 3, tw: -1.4 },
  { x: 94, y: 32, size: 2 },
  { x: 6, y: 35, size: 2, tw: -2.2 },
  { x: 40, y: 30, size: 2 },
] as const;

/*===== Sky Extras =====*/
/**
 * Desktop only (the phone band's sky is mostly under the bubble): the tall panel's sky gets a halo around the moon,
 * twinkling stars and two drifting chalk clouds, so the top of the panel is a night sky and not a black slab. The
 * twinkle and the drift are classes the stage's `<style>` defines (`au-twinkle`, `au-drift`); without motion the stars
 * and clouds simply stand still.
 */
export function SkyExtras() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 hidden text-chalk lg:block">
      {/*------ Moon Halo ------*/}
      {/* Centred on the shared sky's moon: its box is inset 5% from each side and 3% from the top, and the moon (40px) sits
          4% of that box's width in from its end, which is the left in RTL. */}
      <div className="absolute top-[calc(3%+20px)] left-[calc(8.6%+20px)] size-72 -translate-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_255_255/0.06),transparent_62%)]" />

      {/*------ Stars ------*/}
      {STARS.map((star) => (
        <span
          key={`${star.x}-${star.y}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            ...("tw" in star ? { animationDelay: `${star.tw}s` } : {}),
          }}
          className={cn("absolute rounded-full bg-chalk/45", "tw" in star && "au-twinkle")}
        />
      ))}

      {/*------ Clouds ------*/}
      <Cloud className="au-drift absolute top-[14%] right-[6%] w-36 opacity-[0.17]" />
      <Cloud className="au-drift-2 absolute top-[27%] left-[4%] w-28 -scale-x-100 opacity-[0.12]" />
    </div>
  );
}

/** A flat-bottomed cloud drawn as a single chalk line. */
function Cloud({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 72 30"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 25C1 25 0 18 6 17C5 11 12 8 17 11C19 4 31 2 36 9C41 5 50 7 51 13C58 11 63 16 60 21C66 21 67 25 62 25Z" />
    </svg>
  );
}
