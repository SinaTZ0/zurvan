import { cn } from "cn";

/*===== Brand Mark =====*/
/**
 * The dog emblem, kept from the original logo as a mask so it takes the palette's gold leaf. The original also carried a Z
 * stroke for the old name; that mask is no longer used.
 * Size it by height; the width follows the emblem's shape.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block aspect-[61/74] h-10 shrink-0 bg-primary [background-image:var(--gold-leaf)] [mask:url(/logo-mark-ink.png)_center/contain_no-repeat]",
        className,
      )}
    />
  );
}

/*===== Brand Logo =====*/
/**
 * The emblem beside the name as Persian readers say it, «آموزش K9». The "K9" is set in a condensed stencil, the
 * lettering of working-dog crates and K9 unit gear, and drawn larger so its cap height stands level with the emblem.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-[1.625rem] text-primary", className)}>
      <BrandMark className="h-[1.5em]" />
      <span className="flex items-center gap-[0.3em] leading-none">
        <span className="text-gold-leaf text-[1em] font-black">آموزش</span>
        <span dir="ltr" className="text-gold-leaf font-stencil text-[1.55em] font-black tracking-[0.02em]">
          K9
        </span>
      </span>
    </span>
  );
}
