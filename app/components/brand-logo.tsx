import { cn } from "cn";

/*===== Brand Logo =====*/
/**
 * The owner's gold emblem beside the brand name, «زروان». The old «آموزش K9» lettering (Persian word plus stencil K9)
 * was replaced at the owner's request on 2026-10-18; only the text changed, the emblem and its size did not.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 text-[1.625rem] text-primary", className)}>
      <img
        src="/brand/k9-logo-128.webp"
        srcSet="/brand/k9-logo-64.webp 64w, /brand/k9-logo-128.webp 128w, /brand/k9-logo-256.webp 256w"
        sizes="64px"
        alt=""
        width={128}
        height={128}
        decoding="async"
        className="aspect-square h-[1.5em] w-auto shrink-0 object-contain"
      />
      <span className="text-[1.3em] leading-none font-black text-gold-leaf">زروان</span>
    </span>
  );
}
