import { cn } from "cn";

/*===== Dog Tag =====*/
// The dog's mark in the account area: one flat engraved tag, a gold hairline on a raised surface, with the name in the
// display face, a maker's "K9" at the foot and, when the dog has one, its microchip number. Built in HTML and CSS
// rather than SVG text so the Persian name keeps its joins and wraps like text.
//
// Everything is sized in `em`, so the size class only sets the font size and the whole tag scales with it.

const SIZE_CLASSES = {
  /** 40 × 64 px: a row's mark when the dog has no photo. Shows the initial only. */
  sm: "text-[8px]",
  /** 80 × 128 px: a compact tag beside text on phones. */
  portrait: "text-[16px]",
  /** 100 × 160 px. */
  md: "text-[20px]",
  /** 120 × 192 px: on its own, when there is no photo. */
  lg: "text-[24px]",
} as const;

export type DogTagSize = keyof typeof SIZE_CLASSES;

/** The name shrinks as it grows, so a long name still fits the tag in at most two lines. */
function nameSize(name: string): string {
  if (name.length > 14) return "text-[0.8em]";
  if (name.length > 7) return "text-[1.05em]";
  // Wide letters («سگت») are broken mid-word at the largest size, so only one- and two-letter names get it.
  if (name.length > 2) return "text-[1.4em]";
  return "text-[1.7em]";
}

export function DogTag({
  name,
  microchipNumber,
  size = "md",
  stampKey,
  className,
}: {
  name: string;
  microchipNumber?: string | null;
  size?: DogTagSize;
  /** Changing it replays the stamp, e.g. on every keystroke in the form's live preview. */
  stampKey?: string;
  className?: string;
}) {
  const initialOnly = size === "sm";
  const shownName = initialOnly ? (Array.from(name.trim())[0] ?? "") : name.trim();

  return (
    <div
      // The name is said by the page around the tag; the tag itself is a picture of it.
      aria-hidden
      className={cn(
        "relative flex h-[8em] w-[5em] shrink-0 flex-col items-center rounded-[1.6em] border border-primary/45 bg-card pt-[2.1em] pb-[0.7em] text-primary select-none",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {/*------ Punched Hole ------*/}
      <span className="absolute top-[0.55em] size-[0.85em] rounded-full border border-primary/45 bg-background" />

      {/*------ Inner Border ------*/}
      <span className="pointer-events-none absolute inset-[0.28em] rounded-[1.35em] border border-primary/15" />

      {/*------ Name ------*/}
      <span className="flex min-h-0 w-full flex-1 items-center justify-center px-[0.55em]">
        <span
          key={stampKey}
          className={cn(
            "line-clamp-2 text-center font-display leading-[1.2] font-bold text-balance break-words",
            initialOnly ? "text-[2.4em]" : nameSize(shownName),
            stampKey !== undefined && "motion-safe:animate-tag-stamp",
          )}
        >
          {shownName}
        </span>
      </span>

      {/*------ Microchip and Maker's Mark ------*/}
      {!initialOnly && (
        <span className="flex flex-col items-center gap-[0.15em]">
          {microchipNumber && (
            <span dir="ltr" className="text-[0.36em] font-bold tracking-[0.06em] tabular-nums opacity-80">
              {microchipNumber}
            </span>
          )}
          <span className="font-stencil text-[0.6em] leading-none opacity-70">K9</span>
        </span>
      )}
    </div>
  );
}
