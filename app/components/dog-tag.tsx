import { cn } from "cn";

/*===== Dog Tag =====*/
// The dog's mark in the account area (docs/customer-area-design.md, "The One Idea"): a punched metal tag with the
// name stamped into it, a maker's "K9" at the foot and, when the dog has one, its microchip number. Built in HTML and
// CSS rather than SVG text so the Persian name keeps its joins and wraps like text.
//
// Everything is sized in `em`, so the size class only sets the font size and the whole tag scales with it.

const SIZE_CLASSES = {
  /** 40 × 64 px: a row's mark when the dog has no photo. Shows the initial only. */
  sm: "text-[8px]",
  /** 80 × 128 px: hanging from a photo on phones. */
  portrait: "text-[16px]",
  /** 100 × 160 px: hanging from a photo. */
  md: "text-[20px]",
  /** 120 × 192 px: on its own, when there is no photo. */
  lg: "text-[24px]",
} as const;

export type DogTagSize = keyof typeof SIZE_CLASSES;

/**
 * - `engraved`: a gold hairline cut into the dark surface. Calm; for lists and the form's preview.
 * - `leaf`: struck gold leaf. The one gold-leaf object on Dog Detail.
 */
export type DogTagFinish = "engraved" | "leaf";

/** The name shrinks as it grows, so a long name still fits the tag in at most two lines. */
function nameSize(name: string): string {
  if (name.length > 14) return "text-[0.8em]";
  if (name.length > 7) return "text-[1.05em]";
  return "text-[1.7em]";
}

export function DogTag({
  name,
  microchipNumber,
  size = "md",
  finish = "engraved",
  stampKey,
  hanging = false,
  className,
}: {
  name: string;
  microchipNumber?: string | null;
  size?: DogTagSize;
  finish?: DogTagFinish;
  /** Changing it replays the stamp, e.g. on every keystroke in the form's live preview. */
  stampKey?: string;
  /** Adds the split ring through the hole, for a tag hanging from the dog's photo. */
  hanging?: boolean;
  className?: string;
}) {
  const leaf = finish === "leaf";
  const initialOnly = size === "sm";
  const shownName = initialOnly ? (Array.from(name.trim())[0] ?? "") : name.trim();

  return (
    <div
      // The name is said by the page around the tag; the tag itself is a picture of it.
      aria-hidden
      className={cn(
        "relative flex h-[8em] w-[5em] shrink-0 flex-col items-center rounded-[1.6em] pt-[2.1em] pb-[0.7em] select-none",
        leaf
          ? "gold-leaf text-[#4a320c]"
          : "border border-primary/45 bg-card text-primary shadow-[inset_0_1px_0_rgb(240_211_139/0.08),inset_0_-0.4em_0.8em_rgb(0_0_0/0.25)]",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {/*------ Punched Hole ------*/}
      <span
        className={cn(
          "absolute top-[0.55em] size-[0.85em] rounded-full bg-background",
          leaf
            ? "shadow-[inset_0_0.08em_0.12em_rgb(0_0_0/0.6),0_0.05em_0_rgb(255_248_220/0.5)]"
            : "border border-primary/45 shadow-[inset_0_0.08em_0.15em_rgb(0_0_0/0.7)]",
        )}
      />

      {/*------ Ring ------*/}
      {hanging && (
        <span
          className={cn(
            "absolute -top-[0.45em] size-[1.5em] rounded-full border-[0.16em]",
            leaf ? "border-[#c99a43] shadow-[0_0.05em_0.1em_rgb(0_0_0/0.5)]" : "border-primary/70",
          )}
        />
      )}

      {/*------ Stamped Edge ------*/}
      <span
        className={cn(
          "pointer-events-none absolute inset-[0.28em] rounded-[1.35em] border",
          leaf ? "border-[#7a5518]/35" : "border-primary/15",
        )}
      />

      {/*------ Name ------*/}
      <span className="flex min-h-0 w-full flex-1 items-center justify-center px-[0.55em]">
        <span
          key={stampKey}
          className={cn(
            "line-clamp-2 text-center font-display leading-[1.2] font-bold text-balance break-words",
            initialOnly ? "text-[2.4em]" : nameSize(shownName),
            // Stamped: dark in the metal with a lit lower lip, or lit gold cut into the dark.
            leaf ? "[text-shadow:0_0.04em_0_rgb(255_244_208/0.7)]" : "[text-shadow:0_-0.04em_0_rgb(0_0_0/0.8)]",
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
