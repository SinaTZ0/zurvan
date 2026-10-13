import { cn } from "cn";

import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";

import { TileChevron } from "./tile-chevron";

/** `lit`: something waits (gold). `calm`: a waiting-kind number at zero (muted). `plain`: a figure that never waits (ivory). */
export type CountTileTone = "lit" | "calm" | "plain";

const NUMBER_TONES: Record<CountTileTone, string> = {
  lit: "text-primary",
  calm: "text-muted-foreground",
  plain: "text-foreground",
};

/*===== Count Tile =====*/
/**
 * One number that is a link to the list behind it. The whole tile is the one `Link`. Only `lit` tiles get the gold ring:
 * the dashboard is dark when there is nothing to do, and gold is exactly the work.
 *
 * - `row` (default): number, words and chevron on one line. For the tiles that wait for him.
 * - `stacked`: number over words, the chevron in the corner. For three tiles side by side on a phone.
 */
export function CountTile({
  to,
  count,
  label,
  tone,
  layout = "row",
}: {
  to: string;
  count: number;
  label: string;
  tone: CountTileTone;
  layout?: "row" | "stacked";
}) {
  const number = (
    <span
      className={cn(
        "font-extrabold tabular-nums",
        layout === "row" ? "text-3xl" : "text-2xl lg:text-3xl",
        NUMBER_TONES[tone],
      )}
    >
      {formatNumberFa(count)}
    </span>
  );

  return (
    <Link
      to={to}
      className={cn(
        "group flex min-h-16 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/60 focus-visible:border-primary/60",
        tone === "lit" ? "border-primary/40" : "border-border",
        layout === "row" ? "items-center gap-4" : "flex-col gap-1",
      )}
    >
      {layout === "row" ? (
        <>
          {number}
          <span className="min-w-0 flex-1 text-sm font-bold text-pretty">{label}</span>
          <TileChevron />
        </>
      ) : (
        <>
          <span className="flex items-center justify-between gap-2">
            {number}
            <TileChevron className="size-4" />
          </span>
          <span className="text-sm text-pretty text-muted-foreground">{label}</span>
        </>
      )}
    </Link>
  );
}
