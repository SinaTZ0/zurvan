import { cn } from "cn";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "~/components/ui/field";
import { formatTomanShort } from "~/lib/course-format";
import { CENTER_PHONE } from "~/lib/contact";
import { BOOKING_PLACES, type BookingPlace } from "~/routes/account_book/schema";

const PLACE_LABELS: Record<BookingPlace, string> = { home: "در خانه‌ی من", boarding: "پانسیون" };

/*===== Place Choice =====*/
/**
 * «در خانه‌ی من» or «پانسیون» as two radio cards. Boarding carries its extra price; without one it can't be booked
 * online, so it is disabled and the phone number is written under the choice (outside the label: a link inside a
 * label would fight the radio for the click).
 */
export function PlaceChoice({
  boardingPrice,
  registration,
  error,
}: {
  /** Rial; null when boarding is priced on request. */
  boardingPrice: number | null;
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
}) {
  const errorId = `${registration.name}-error`;
  const boardingUnavailable = boardingPrice === null;

  return (
    <fieldset className="flex flex-col gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-2 text-sm font-bold">جلسه‌ها کجا باشد؟</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {BOOKING_PLACES.map((place) => {
          const disabled = place === "boarding" && boardingUnavailable;
          return (
            <label key={place} className={cn("relative block", disabled && "opacity-60")}>
              <input type="radio" value={place} disabled={disabled} className="peer sr-only" {...registration} />
              <span
                className={cn(
                  "flex h-full flex-col gap-1 rounded-2xl bg-card p-4 ring-1 ring-border transition-shadow",
                  disabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer peer-checked:ring-2 peer-checked:ring-primary hover:ring-primary/50",
                  "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                )}
              >
                <span className="font-extrabold">{PLACE_LABELS[place]}</span>
                <span className="text-sm text-pretty text-muted-foreground">
                  {place === "home"
                    ? "آرمان به نشانی تو می‌آید یا بیرون با هم قرار می‌گذارید."
                    : boardingUnavailable
                      ? "قیمت پانسیون را تلفنی بپرس"
                      : `+ ${formatTomanShort(boardingPrice)}`}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {boardingUnavailable && (
        <p className="text-sm text-pretty text-muted-foreground">
          پانسیون این دوره قیمت ثابت ندارد. برای پرسیدنش زنگ بزن:{" "}
          <a
            href={`tel:${CENTER_PHONE.tel}`}
            dir="ltr"
            className="rounded-sm font-bold text-primary underline-offset-4 hover:underline"
          >
            {CENTER_PHONE.display}
          </a>
        </p>
      )}
      <div id={errorId}>
        <FieldError errors={[error]} />
      </div>
    </fieldset>
  );
}
