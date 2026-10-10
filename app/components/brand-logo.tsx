import { cn } from "cn";

/*===== Brand Mark =====*/
/**
 * The dog-and-Z emblem, cut from the original logo into two masks so each part takes a palette colour: the dog in
 * firuzeh, the Z stroke in saffron. Inside `surface-inverse` the primary token turns ivory, so the mark follows.
 * Size it by height; the width follows the emblem's shape.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-block aspect-[61/74] h-10 shrink-0", className)}>
      <span className="absolute inset-0 bg-primary [mask:url(/logo-mark-ink.png)_center/contain_no-repeat]" />
      <span className="absolute inset-0 bg-saffron [mask:url(/logo-mark-gold.png)_center/contain_no-repeat]" />
    </span>
  );
}

/*===== Brand Logo =====*/
/**
 * The emblem beside the name set in Persian. The old artwork spelled the name in Latin letters only, which Persian
 * readers would not say or remember, so the wordmark is live text in the site's own typeface.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-[1.625rem] text-primary", className)}>
      <BrandMark className="h-[1.5em]" />
      <span className="text-[1em] leading-none font-black">زروان</span>
    </span>
  );
}
