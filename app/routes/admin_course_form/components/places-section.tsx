import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useEffect } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";

import { COURSE_PLACE_LABELS, COURSE_PLACES, normalizeCoursePlaces } from "~/orpc/course/constants";
import { ChoicePills } from "~/routes/admin_course_form/components/choice-pills";
import { FieldHint, FieldMessage } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, NO_PLACE } from "~/routes/admin_course_form/schema";

/*===== Places Section =====*/
/**
 * «جای آموزش» (F8): the places this course can be taught, as ticks, and optionally the one she recommends. The customer
 * picks one of the ticked places in the cart; nothing ticked means the place is settled after the evaluation and the
 * cart asks nothing. Boarding's extra cost is never a price here: the cart tells the customer she will call about it.
 *
 * The recommendation is offered only among the ticked places; unticking the recommended one clears it, so the form
 * never holds a recommendation the customer couldn't pick.
 */
export function PlacesSection() {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const {
    field: { value, onChange, ref },
    fieldState: { error },
  } = useController({ control, name: "places" });
  const ticked = normalizeCoursePlaces(value ?? []);
  const recommended = useWatch({ control, name: "recommendedPlace" });

  /*------ Recommendation Follows the Ticks ------*/
  useEffect(() => {
    if (recommended && recommended !== NO_PLACE && !(value ?? []).includes(recommended)) {
      setValue("recommendedPlace", NO_PLACE, { shouldDirty: true });
    }
  }, [recommended, value, setValue]);

  return (
    <FormSection
      id="places"
      description="جاهایی که این دوره برگزار می‌شه رو تیک بزن؛ مشتری موقع خرید، توی سبد یکی‌شون رو انتخاب می‌کنه."
    >
      {/*------ Places ------*/}
      {/* `data-invalid` lets the form's «first field with a message» find the group. */}
      <fieldset
        data-invalid={error ? true : undefined}
        className="flex min-w-0 flex-col gap-2"
        aria-describedby={["course-places-hint", error && "course-places-error"].filter(Boolean).join(" ")}
      >
        <legend className="mb-2 text-sm font-bold">کجاها برگزار می‌شه</legend>
        <div className="flex flex-wrap gap-2">
          {COURSE_PLACES.map((place, index) => {
            const checked = ticked.includes(place);
            return (
              <label key={place} className="relative">
                <input
                  ref={index === 0 ? ref : undefined}
                  type="checkbox"
                  name="places"
                  value={place}
                  checked={checked}
                  onChange={(event) =>
                    onChange(
                      COURSE_PLACES.filter((candidate) =>
                        candidate === place ? event.target.checked : ticked.includes(candidate),
                      ),
                    )
                  }
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex h-10 cursor-pointer items-center gap-1.5 rounded-full border bg-card px-4 text-sm font-bold text-muted-foreground select-none",
                    "transition-[background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none",
                    error ? "border-destructive/60" : "border-foreground/15",
                    "hover:border-foreground/30 hover:text-foreground",
                    "peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-foreground",
                    "peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50",
                  )}
                >
                  {checked && <CheckIcon aria-hidden strokeWidth={3} className="size-4 text-primary" />}
                  {COURSE_PLACE_LABELS[place]}
                </span>
              </label>
            );
          })}
        </div>
        <FieldHint id="course-places">
          {ticked.length === 0
            ? "هیچ‌کدوم تیک نخوره یعنی جا بعد از ارزیابی مشخص می‌شه و سبد چیزی نمی‌پرسه."
            : "پانسیون هزینه‌ی جدا داره و توی قیمت دوره نیست؛ اگه مشتری انتخابش کنه، سبد بهش می‌گه برای هزینه‌ش باهاش تماس می‌گیری."}
        </FieldHint>
        <FieldMessage id="course-places" message={error?.message} />
      </fieldset>

      {/*------ Recommended ------*/}
      {/* With one place there is nothing to recommend between. */}
      {ticked.length > 1 && (
        <ChoicePills
          legend="جای پیشنهادی (اختیاری)"
          options={[
            ...ticked.map((place) => ({ value: place, label: COURSE_PLACE_LABELS[place] })),
            { value: NO_PLACE, label: "پیشنهادی نداره" },
          ]}
          registration={register("recommendedPlace")}
          error={errors.recommendedPlace}
        />
      )}
    </FormSection>
  );
}
