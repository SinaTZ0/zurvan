import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { formatToman } from "~/lib/course-format";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, parseWholeNumber } from "~/routes/admin_course_form/schema";

/*===== Price Section =====*/
/**
 * «قیمت»: Toman, as people say it. The echo under the price reads what was typed back with its separators, so a
 * missing zero is seen before saving. The form sends Rial (Toman × 10).
 */
export function PriceSection({ isNew }: { isNew: boolean }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const priceText = useWatch({ control, name: "price" }) ?? "";
  const price = parseWholeNumber(priceText);
  const empty = priceText.trim() === "";

  return (
    <FormSection title="قیمت">
      {/*------ Price ------*/}
      <Field data-invalid={!!errors.price} className="max-w-sm">
        <FieldLabel htmlFor="course-price">قیمت (تومان)</FieldLabel>
        <Input
          id="course-price"
          inputMode="numeric"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.price}
          {...register("price")}
        />
        <p aria-live="polite" className="text-sm font-bold">
          {empty ? "بعد از ارزیابی" : price === null ? null : formatToman(price * 10)}
        </p>
        {empty && <FieldDescription>بدون قیمت، دوره‌ی قابل خرید نیست.</FieldDescription>}
        {!isNew && !empty && (
          <FieldDescription>
            قیمت تازه فقط برای خریدهای بعدی است؛ ثبت‌نام‌های قبلی همان قیمتی را که پرداخت کرده‌اند نگه می‌دارند.
          </FieldDescription>
        )}
        <FieldError errors={[errors.price]} />
      </Field>

      {/*------ Boarding Price ------*/}
      <Field data-invalid={!!errors.boardingPrice} className="max-w-sm">
        <FieldLabel htmlFor="course-boarding-price">قیمت نگهداری شبانه (تومان، اختیاری)</FieldLabel>
        <Input
          id="course-boarding-price"
          inputMode="numeric"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.boardingPrice}
          {...register("boardingPrice")}
        />
        <FieldDescription>فقط نمایش داده می‌شود؛ همراه خرید پرداخت نمی‌شود.</FieldDescription>
        <FieldError errors={[errors.boardingPrice]} />
      </Field>
    </FormSection>
  );
}
