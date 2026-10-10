import { cn } from "cn";
import { PawPrintIcon } from "lucide-react";
import { Fragment } from "react";

import { formatNumberFa } from "~/lib/digits";

export type Seats = {
  capacity: number;
  reserved: number;
  /** Reservations the run needs before it's confirmed (spec 3.3). */
  minToStart: number;
};

/*===== Seat Summary =====*/
/**
 * The two facts a customer weighs before reserving: will the run happen, and is there room. Wording follows the
 * spec: "remaining to start" until the minimum is reached, then seats left, or "تکمیل ظرفیت" when full.
 */
export function describeSeats({ capacity, reserved, minToStart }: Seats) {
  const left = capacity - reserved;
  const toStart = minToStart - reserved;

  if (left <= 0) return { isFull: true, isConfirmed: true, status: "تکمیل ظرفیت", detail: "فهرست انتظار باز است" };
  return {
    isFull: false,
    isConfirmed: toStart <= 0,
    status: toStart > 0 ? `${formatNumberFa(toStart)} رزرو دیگر تا شروع` : "کلاس قطعی است",
    detail: `${formatNumberFa(left)} جای خالی`,
  };
}

/*===== Seat Roster =====*/
/**
 * A run's seats drawn one by one, filled for reserved seats, with a notch after the minimum to start. This is the
 * homepage's signature: it shows at a glance the rule that makes Zurvann runs different (a class starts only once
 * enough pets join).
 *
 * `paws` is the large hero version, whose seats fill in one after another. `bar` is the slim one for lists.
 */
export function SeatRoster({
  seats,
  variant = "bar",
  className,
}: {
  seats: Seats;
  variant?: "paws" | "bar";
  className?: string;
}) {
  const { capacity, reserved, minToStart } = seats;
  const label = `${formatNumberFa(reserved)} از ${formatNumberFa(capacity)} جا رزرو شده، حد نصاب ${formatNumberFa(minToStart)}`;
  // The fill-in takes at most about 1.2s, however many seats are reserved.
  const step = Math.min(110, 1200 / Math.max(reserved, 1));

  return (
    <div className={cn("flex items-center", variant === "paws" ? "gap-1 sm:gap-1.5" : "gap-0.5", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: capacity }, (_, index) => {
        const isReserved = index < reserved;
        // The notch sits between the last seat of the minimum and the first one past it.
        const isThreshold = index === minToStart - 1 && minToStart < capacity;

        return (
          <Fragment key={index}>
            {variant === "paws" ? (
              // Paws share the row and shrink when a big online class has more seats than fit; with room to spare
              // they stop at full size and stay packed at the start.
              <PawPrintIcon
                aria-hidden
                strokeWidth={1.7}
                fill={isReserved ? "currentColor" : "none"}
                className={cn(
                  "h-auto max-w-7 min-w-0 flex-1 basis-0",
                  isReserved
                    ? "text-primary motion-safe:animate-in motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:zoom-in-50 motion-safe:fade-in"
                    : "text-foreground/30",
                )}
                // Seats fill one after another: on load, and again whenever the hero's answer changes.
                style={isReserved ? { animationDelay: `${300 + index * step}ms` } : undefined}
              />
            ) : (
              <span
                aria-hidden
                className={cn("h-1.5 min-w-0 flex-1 rounded-full", isReserved ? "bg-primary" : "bg-foreground/15")}
              />
            )}
            {/* Its own flex item, so it never squeezes the seat beside it. */}
            {isThreshold && (
              <span
                aria-hidden
                className={cn(
                  "shrink-0 rounded-full",
                  variant === "paws" ? "mx-0.5 h-7 w-px bg-foreground/40" : "mx-0.5 h-3 w-px bg-foreground/50",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
