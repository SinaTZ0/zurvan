import { Link } from "~/components/link";
import { LINKS } from "~/routes/new_design/content";
import { cn } from "cn";

/*===== Cut-outs =====*/
// Natural sizes of the transparent cut-outs. Every image is decorative (the bubbles carry the words), so the alt is
// empty. The rendered width stays under ~1.3x the natural one, because the files are low resolution.
const CUTS = {
  paws: { width: 285, height: 463 },
  peek: { width: 271, height: 275 },
  sit: { width: 317, height: 473 },
  leash: { width: 249, height: 456 },
  upside: { width: 232, height: 344 },
  ears: { width: 271, height: 209 },
  plants: { width: 354, height: 379 },
  hedge: { width: 475, height: 176 },
  ground: { width: 492, height: 93 },
  home: { width: 474, height: 275 },
  center: { width: 491, height: 280 },
  lodge: { width: 480, height: 271 },
  // The poses in «چه چیزی یاد می‌دهیم؟», one per service.
  "teach-basic": { width: 308, height: 392 },
  "teach-calm": { width: 402, height: 216 },
  "teach-work": { width: 340, height: 401 },
  "teach-medal": { width: 362, height: 393 },
  "teach-advice": { width: 433, height: 397 },
  // Props along the steps' trail.
  signpost: { width: 360, height: 325 },
  key: { width: 360, height: 250 },
  flag: { width: 360, height: 313 },
  bone: { width: 360, height: 174 },
} as const;

export type CutName = keyof typeof CUTS;

// The scenery steps back so the dog stays the brightest thing on the page (`.st-dim`, story-theme). The dog cut-outs are
// never dimmed; the key and the flag stay bright too, as the steps' two gold accents (the unlock and the finish).
const DIMMED = new Set<CutName>(["plants", "ground", "home", "center", "lodge", "signpost", "bone"]);

/** One mascot or scenery cut-out. Position and size come from `className`; the aspect ratio is kept by `h-auto`. */
export function Cut({ name, className, eager = false }: { name: CutName; className?: string; eager?: boolean }) {
  const { width, height } = CUTS[name];
  return (
    <img
      src={`/photo/new-design/${name}.webp`}
      alt=""
      width={width}
      height={height}
      loading={eager ? undefined : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      draggable={false}
      className={cn("pointer-events-none h-auto max-w-none select-none", DIMMED.has(name) && "st-dim", className)}
    />
  );
}

/*===== Ground Strip =====*/
// The ground cut-out tiled edge to edge as a path between two sections. Its ends taper off, so one tile row would
// dip at every seam: a second row, mirrored and shifted half a tile, fills the dips and breaks up the repeat. A tile
// is the strip's height x 492/93 wide (296px, 381px at md); the mirrored row is placed from the right, which the flip
// turns into the left, so its seams land halfway between the first row's whatever the screen width.
const GROUND_TILE = "url(/photo/new-design/ground.webp)";

/** A full-width strip of path (dirt, stones, grass) that separates two sections. Decorative. */
export function GroundStrip({ className }: { className?: string }) {
  const row = "absolute inset-0 bg-[length:auto_100%] bg-repeat-x";
  return (
    <div aria-hidden className={cn("st-dim pointer-events-none relative h-14 md:h-[4.5rem]", className)}>
      <div
        className={cn(row, "-scale-x-100 bg-[position:right_148px_top_0] md:bg-[position:right_190px_top_0]")}
        style={{ backgroundImage: GROUND_TILE }}
      />
      <div className={cn(row, "translate-y-[6%]")} style={{ backgroundImage: GROUND_TILE }} />
    </div>
  );
}

/*===== Speech Bubble =====*/
/**
 * Fandogh's hand-drawn bubble: ink outline, paper fill, and a tail that points at him. `tail` is a physical side
 * (left/right) because the tail is a rotated square and must aim at the dog, whichever way the page reads.
 */
export function Bubble({
  children,
  tail = "right",
  className,
}: {
  children: React.ReactNode;
  tail?: "left" | "right";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "relative w-max max-w-full rounded-[1.4rem] border-2 border-(--st-bubble-line) bg-(--st-paper) px-4 py-2.5 font-hand text-[15px] leading-snug text-(--st-bubble-ink) md:text-lg",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute -bottom-[9px] size-4 rotate-45 border-r-2 border-b-2 border-(--st-bubble-line) bg-(--st-paper)",
          tail === "right" ? "right-7" : "left-7",
        )}
      />
    </p>
  );
}

/*===== Buttons =====*/
/** The main action everywhere: the free evaluation, near-black on the gold. */
export function EvaluationButton({
  children = "درخواست ارزیابی رایگان",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={LINKS.evaluation}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-(--st-red) px-7 py-3 text-base font-bold text-(--st-on-red) transition-colors hover:bg-(--st-red-deep) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--st-ink)",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/** Section heading face: Estedad at 800 with tight leading, a heavy modern Persian sans with a bookish weight. */
export const HEADING = "font-display font-extrabold leading-[1.2] tracking-tight text-(--st-ink)";

/*===== Ticks =====*/
/** Three short ink strokes beside the dog's head, the storybook sign for "excited". Drawn for the head's right side. */
export function Ticks({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={cn("pointer-events-none text-(--st-ink)/80", className)}
    >
      <path d="M14 9l6-5M13 13h7M14 17l6 4" />
    </svg>
  );
}
