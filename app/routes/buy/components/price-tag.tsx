import { cn } from "cn";

import { formatTomanShort } from "~/lib/course-format";

/*===== Price Tag =====*/
/**
 * A course's price on a small chalk tag: an ink outline with a pointed start end and a punched hole, hanging a little
 * askew, the amount in gold on the paper (Course Detail's tag, smaller, without the string). The outline is an SVG
 * stretched to the tag (`non-scaling-stroke` keeps the ink even), so the tag fits its words whatever the price; the hole
 * is its own circle, which stretching would squash.
 *
 * Physical sides on purpose: the point and the hole are on the tag's right, the reading start in RTL, and the wide
 * padding stays on that side in English too, so the amount never runs into the hole. `swingKey`
 * changes when the course goes into the cart: the tag remounts and swings once on its hole (`by-swing`).
 */
export function PriceTag({
  price,
  swingKey,
  className,
}: {
  price: number;
  /** Null until something happens to the tag; then a new value replays the swing. */
  swingKey: number | null;
  className?: string;
}) {
  return (
    <p
      key={swingKey ?? "still"}
      className={cn(
        "relative flex w-max shrink-0 origin-[calc(100%-1.4rem)_50%] -rotate-[2.5deg] items-center py-2 pr-10 pl-4",
        swingKey !== null && "by-swing",
        className,
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 200 80"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible text-foreground/80"
      >
        <path
          d="M10 2H168L198 40L168 78H10Q2 78 2 70V10Q2 2 10 2Z"
          fill="var(--background)"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        aria-hidden
        className="absolute top-1/2 right-[1.05rem] size-2 -translate-y-1/2 rounded-full border-2 border-foreground/80 bg-sunken"
      />
      <span className="relative text-lg font-black whitespace-nowrap text-primary tabular-nums">
        {formatTomanShort(price)}
      </span>
    </p>
  );
}
