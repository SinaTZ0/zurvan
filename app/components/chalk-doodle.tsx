import { cn } from "cn";

/*===== Chalk Doodle =====*/
// White marker doodles around the dogs and their bubbles: decoration only, so they are hidden from screen readers.
// Each image is trimmed to its strokes, so size them by width.
// Part of the previous look (with `SpeechBubble`): kept for the pages not yet redesigned; the mascot pages don't use it.
export type ChalkDoodleName =
  "heart" | "paw" | "crown" | "arrow-curl" | "arrow-loop" | "bone" | "sparkles" | "swoosh" | "exclaim";

/** One doodle. Place it with `className` (absolute position, width, rotation, opacity). */
export function ChalkDoodle({ name, className }: { name: ChalkDoodleName; className?: string }) {
  return (
    <img
      src={`/photo/home/doodle-${name}.webp`}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      draggable={false}
      className={cn("pointer-events-none h-auto select-none", className)}
    />
  );
}
