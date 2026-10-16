import { cn } from "cn";

/*===== Brand Logo =====*/
/** The owner's gold emblem beside the original Persian name and stencil K9 lettering. */
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
      <span className="flex items-center gap-[0.3em] leading-none">
        <span className="text-[1em] font-black text-gold-leaf">آموزش</span>
        <span dir="ltr" className="font-stencil text-[1.55em] font-black tracking-[0.02em] text-gold-leaf">
          K9
        </span>
      </span>
    </span>
  );
}
