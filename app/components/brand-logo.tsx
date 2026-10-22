import { cn } from "cn";

import { CENTER } from "~/lib/contact";

/*===== Brand Logo =====*/
/**
 * The owner's gold emblem beside the brand name, «زروان». The old «آموزش K9» lettering (Persian word plus stencil K9)
 * was replaced at the owner's request on 2026-10-18; only the text changed, the emblem and its size did not.
 *
 * `descriptor` adds the center's full name line under the wordmark («مجموعه تربیتی و رفتارشناسی سگ زروان», which the
 * owner asked to read next to the emblem). It is for the storefront header: the line sits inside the wordmark's own
 * height, so the header keeps its size, and it is dropped on the narrowest phones where it would crowd the menu button.
 */
export function BrandLogo({ className, descriptor = false }: { className?: string; descriptor?: boolean }) {
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
      {descriptor ? (
        <span className="flex flex-col gap-1.5">
          <span className="text-[1.3em] leading-none font-black text-gold-leaf">{CENTER.name}</span>
          {/* A fixed small size (not `em`): at the wordmark's scale the line would be too small to read. */}
          <span className="hidden text-[0.6875rem] leading-none font-bold text-pretty text-muted-foreground min-[380px]:block lg:text-xs">
            {CENTER.descriptor}
          </span>
        </span>
      ) : (
        <span className="text-[1.3em] leading-none font-black text-gold-leaf">{CENTER.name}</span>
      )}
    </span>
  );
}
