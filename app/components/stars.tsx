import { cn } from "cn";
import { StarIcon } from "lucide-react";

const digitFormat = new Intl.NumberFormat("fa-IR");

/*===== Stars =====*/
/**
 * A rating out of five as filled and empty stars, with the rating spelled out for screen readers. `className` goes on
 * the wrapping `<p>`; `size` picks the star size (default `sm`).
 */
export function Stars({ rating, className, size = "sm" }: { rating: number; className?: string; size?: "sm" | "md" }) {
  const starSize = size === "md" ? "size-4.5" : "size-3.5";

  return (
    <p className={cn("flex gap-0.5", className)}>
      <span className="sr-only">{`${digitFormat.format(rating)} از ${digitFormat.format(5)} ستاره`}</span>
      {Array.from({ length: 5 }, (_, index) => (
        <StarIcon
          key={index}
          strokeWidth={1.7}
          aria-hidden
          fill={index < rating ? "currentColor" : "none"}
          className={cn(starSize, index < rating ? "text-saffron" : "text-faint")}
        />
      ))}
    </p>
  );
}
