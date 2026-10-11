import { useId } from "react";
import { Controller, type Control } from "react-hook-form";

import { Checkbox } from "~/components/ui/checkbox";
import { FieldError } from "~/components/ui/field";
import type { BookingFormInput } from "~/routes/account_book/schema";

/*===== Retake Notice =====*/
/**
 * Shown once a dog that has already passed this course is picked. Booking it again is allowed (the owner may want a
 * refresher) but never by accident, so the customer confirms in their own words.
 */
export function RetakeNotice({
  control,
  dogName,
  isTest,
}: {
  control: Control<BookingFormInput>;
  dogName: string;
  isTest: boolean;
}) {
  const id = useId();

  return (
    <Controller
      control={control}
      name="confirmRetake"
      render={({ field, fieldState }) => (
        <div className="flex flex-col gap-2 rounded-2xl bg-sunken p-4 ring-1 ring-primary/30">
          <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
            <Checkbox
              id={id}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
              onBlur={field.onBlur}
              aria-invalid={!!fieldState.error}
              className="mt-1"
            />
            <span className="text-pretty">
              <span className="block font-bold">
                {dogName} این {isTest ? "تست" : "دوره"} را قبلاً با موفقیت گذرانده است.
              </span>
              <span className="block text-muted-foreground">می‌خواهم دوباره بگیرد.</span>
            </span>
          </label>
          <FieldError errors={[fieldState.error]} />
        </div>
      )}
    />
  );
}
