import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { formatToman } from "~/lib/course-format";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, parseWholeNumber } from "~/routes/admin_course_form/schema";
import { tomanInWords } from "~/routes/admin_course_form/toman-words";

/*===== Price Section =====*/
/**
 * «قیمت»: Toman, as people say it. Under each price the amount is read back as he types, with its separators and in
 * words («چهار میلیون و پانصد هزار تومان»), so a missing zero is seen before saving. An empty price is «بعد از
 * ارزیابی». The form sends Rial (Toman × 10).
 */
export function PriceSection({ isNew }: { isNew: boolean }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<CourseFormInput>();
  const priceText = useWatch({ control, name: "price" }) ?? "";
  const boardingText = useWatch({ control, name: "boardingPrice" }) ?? "";
  const priceHint =
    priceText.trim() === ""
      ? "بدون قیمت، دوره خریدنی نیست."
      : isNew
        ? null
        : "قیمت تازه فقط برای خریدهای بعدیه؛ ثبت‌نام‌های قبلی همون قیمتی رو که دادن نگه می‌دارن.";

  return (
    <FormSection id="price">
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        {/*------ Price ------*/}
        <Field data-invalid={!!errors.price} className="gap-2">
          <FieldLabel htmlFor="course-price">قیمت (تومان)</FieldLabel>
          <Input
            id="course-price"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.price}
            aria-describedby={describedBy({ id: "course-price", hint: !!priceHint, error: !!errors.price })}
            {...register("price")}
          />
          <AmountEcho text={priceText} empty="بعد از ارزیابی" />
          {priceHint && <FieldHint id="course-price">{priceHint}</FieldHint>}
          <FieldMessage id="course-price" message={errors.price?.message} />
        </Field>

        {/*------ Boarding Price ------*/}
        <Field data-invalid={!!errors.boardingPrice} className="gap-2">
          <FieldLabel htmlFor="course-boardingPrice">قیمت نگهداری شبانه (تومان، اختیاری)</FieldLabel>
          <Input
            id="course-boardingPrice"
            inputMode="numeric"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.boardingPrice}
            aria-describedby={describedBy({ id: "course-boardingPrice", hint: true, error: !!errors.boardingPrice })}
            {...register("boardingPrice")}
          />
          <AmountEcho text={boardingText} empty="نداره" />
          <FieldHint id="course-boardingPrice">فقط نشون داده می‌شه؛ همراه خرید پرداخت نمی‌شه.</FieldHint>
          <FieldMessage id="course-boardingPrice" message={errors.boardingPrice?.message} />
        </Field>
      </div>
    </FormSection>
  );
}

/*===== Amount Echo =====*/
/**
 * What was typed, read back: «۴٬۵۰۰٬۰۰۰ تومان» in bold ivory and its words under it, or the empty field's meaning.
 * Text that isn't a whole number yet echoes nothing (the message on submit says why). Announced politely, so a
 * screen reader hears the amount once he stops typing.
 */
function AmountEcho({ text, empty }: { text: string; empty: string }) {
  const value = parseWholeNumber(text);
  const words = value === null ? null : tomanInWords(value);

  return (
    <div aria-live="polite" className="min-h-10">
      {text.trim() === "" ? (
        <p className="text-sm font-bold text-foreground/85">{empty}</p>
      ) : value === null ? null : (
        <>
          <p className="text-sm font-bold tabular-nums">{formatToman(value * 10)}</p>
          {words && <p className="text-xs text-pretty text-muted-foreground">{words} تومان</p>}
        </>
      )}
    </div>
  );
}
