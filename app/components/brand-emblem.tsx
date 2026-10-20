import { cn } from "cn";

/*===== Brand Emblem =====*/
/** The owner's gold K9 emblem (the same picture as `BrandLogo` and the favicon), set beside the «زروان» wordmark. */
export function BrandEmblem({ className }: { className?: string }) {
  return (
    <img
      src="/brand/k9-logo-128.webp"
      srcSet="/brand/k9-logo-64.webp 64w, /brand/k9-logo-128.webp 128w, /brand/k9-logo-256.webp 256w"
      sizes="64px"
      alt=""
      width={128}
      height={128}
      decoding="async"
      className={cn("aspect-square shrink-0 object-contain", className)}
    />
  );
}
