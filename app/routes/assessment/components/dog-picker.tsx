import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import type { FieldError as FormFieldError, UseFormRegisterReturn } from "react-hook-form";

import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { FieldError } from "~/components/ui/field";
import { describeDog } from "~/lib/dog-format";
import { formatSlotDay } from "~/lib/tehran-time";
import { DogThumb } from "~/routes/assessment/components/dog-thumb";
import type { DogChoice } from "~/routes/assessment/dog-choices";
import { formatSpokenTime } from "~/routes/assessment/slots";

/*===== Dog Picker =====*/
/**
 * Part 1: the customer's dogs as selectable tiles. A dog that can't book is shown but disabled, with the reason and,
 * for a dog with a record, the way to book its next course. The last tile adds a new dog and comes back here.
 */
export function DogPicker({
  choices,
  registration,
  error,
  newDogHref,
}: {
  choices: readonly DogChoice[];
  registration: UseFormRegisterReturn;
  error?: FormFieldError;
  newDogHref: string;
}) {
  const errorId = `${registration.name}-error`;

  return (
    <div aria-describedby={error ? errorId : undefined} className="flex flex-col gap-3">
      {/* Phones scroll the tiles sideways (bleeding to the screen edge); wider screens wrap them. */}
      <div className="-mx-site flex snap-x gap-3 overflow-x-auto px-site pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
        {choices.map(({ dog, availability }) => {
          const facts = describeDog(dog);

          if (availability.kind === "open") {
            return (
              <label key={dog.id} className="relative block w-56 shrink-0 snap-start">
                <input type="radio" value={dog.id} className="peer sr-only" {...registration} />
                <span
                  className={cn(
                    "flex h-full items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border transition-shadow",
                    "cursor-pointer peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:ring-primary/50",
                  )}
                >
                  <DogThumb dog={dog} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{dog.name}</span>
                    <span className="block text-xs text-pretty text-muted-foreground">{facts}</span>
                  </span>
                </span>
              </label>
            );
          }

          return (
            <div
              key={dog.id}
              className="flex w-56 shrink-0 snap-start flex-col gap-2 rounded-2xl bg-sunken p-3 ring-1 ring-border/60"
            >
              <div className="flex items-center gap-3 opacity-60">
                <DogThumb dog={dog} />
                <p className="min-w-0">
                  <span className="block truncate font-bold">{dog.name}</span>
                  <span className="block text-xs text-pretty text-muted-foreground">{facts}</span>
                </p>
              </div>
              {availability.kind === "record" ? (
                <Link
                  to={`/account/dogs/${dog.id}`}
                  className="rounded-sm text-sm font-bold text-pretty text-primary underline-offset-4 hover:underline"
                >
                  پرونده دارد؛ مستقیم دوره رزرو کن
                </Link>
              ) : (
                <p className="text-sm font-bold text-pretty text-muted-foreground">
                  {formatSlotDay(availability.startsAt)}، ساعت {formatSpokenTime(availability.startsAt)} رزرو شده
                </p>
              )}
            </div>
          );
        })}

        {/*------ New Dog ------*/}
        <Link
          to={newDogHref}
          className="flex min-h-20 w-56 shrink-0 snap-start items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 p-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
        >
          <PlusIcon aria-hidden className="size-5" />
          سگ تازه
        </Link>
      </div>

      <div id={errorId}>
        <FieldError errors={[error]} />
      </div>
    </div>
  );
}

/*===== No Dogs =====*/
/** Part 1 for a customer with no dogs at all: one line and the way to add the first. */
export function NoDogs({ newDogHref }: { newDogHref: string }) {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-pretty text-muted-foreground">
        اول سگت را معرفی کن؛ آرمان با همین اطلاعات برای دیدنش آماده می‌شود.
      </p>
      <Link to={newDogHref} className={buttonVariants({ variant: "solid", size: "lg", className: "px-8" })}>
        سگت را معرفی کن
      </Link>
    </div>
  );
}
