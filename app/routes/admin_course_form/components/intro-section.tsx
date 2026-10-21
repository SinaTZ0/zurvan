import { cn } from "cn";
import { LockIcon } from "lucide-react";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { formatNumberFa } from "~/lib/digits";
import { FAMILY_TABS } from "~/lib/course-families";
import { COURSE_SUMMARY_MAX_LENGTH } from "~/orpc/course/validation";
import { ChoicePills } from "~/routes/admin_course_form/components/choice-pills";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, slugFromLatinName } from "~/routes/admin_course_form/schema";

const SLUG_NOTE = "بعد از ساخت عوض نمی‌شه.";

/*===== Intro Section =====*/
/**
 * «معرفی دوره»: the name, the Latin name, the family, a short summary and, for a new course, its address. The address
 * starts as the Latin name in kebab-case and follows it until he types in it himself; an edited course shows its
 * address as plain text, because carts and links already hold it.
 */
export function IntroSection({ slug }: { slug: string | null }) {
  const {
    register,
    setValue,
    control,
    formState: { errors, isSubmitted },
  } = useFormContext<CourseFormInput>();
  const [slugEdited, setSlugEdited] = useState(false);
  const typedSlug = useWatch({ control, name: "slug" });
  const summaryLength = (useWatch({ control, name: "summary" }) ?? "").trim().length;

  return (
    <FormSection id="intro">
      {/*------ Names ------*/}
      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Field data-invalid={!!errors.title} className="gap-2">
          <FieldLabel htmlFor="course-title">نام دوره</FieldLabel>
          <Input
            id="course-title"
            autoComplete="off"
            placeholder="مثلاً سگ خونگی"
            className="h-11 text-sm"
            aria-invalid={!!errors.title}
            aria-describedby={describedBy({ id: "course-title", error: !!errors.title })}
            {...register("title")}
          />
          <FieldMessage id="course-title" message={errors.title?.message} />
        </Field>

        <Field data-invalid={!!errors.latinName} className="gap-2">
          <FieldLabel htmlFor="course-latinName">نام لاتین</FieldLabel>
          <Input
            id="course-latinName"
            dir="ltr"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.latinName}
            aria-describedby={describedBy({ id: "course-latinName", hint: true, error: !!errors.latinName })}
            {...register("latinName", {
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                if (slug === null && !slugEdited) {
                  setValue("slug", slugFromLatinName(event.target.value), { shouldValidate: isSubmitted });
                }
              },
            })}
          />
          <FieldHint id="course-latinName">
            زیر نام دوره توی صفحه‌ی دوره و سبد خرید میاد: <bdi dir="ltr">House manner</bdi>، <bdi dir="ltr">CGC</bdi>.
          </FieldHint>
          <FieldMessage id="course-latinName" message={errors.latinName?.message} />
        </Field>
      </div>

      {/*------ Address ------*/}
      {slug === null ? (
        <Field data-invalid={!!errors.slug} className="gap-2">
          <FieldLabel htmlFor="course-slug">نشانی صفحه</FieldLabel>
          <Input
            id="course-slug"
            dir="ltr"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.slug}
            aria-describedby={describedBy({ id: "course-slug", hint: true, error: !!errors.slug })}
            {...register("slug", { onChange: () => setSlugEdited(true) })}
          />
          <FieldHint id="course-slug">
            {typedSlug ? (
              <>
                <bdi dir="ltr">/courses/{typedSlug}</bdi>؛{" "}
              </>
            ) : (
              "از نام لاتین ساخته می‌شه؛ "
            )}
            {SLUG_NOTE}
          </FieldHint>
          <FieldMessage id="course-slug" message={errors.slug?.message} />
        </Field>
      ) : (
        // Read-only: an inset that reads as a fixed fact, not a disabled input he might try to click into.
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold">نشانی صفحه</p>
          <p className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-foreground/15 px-4 text-sm text-muted-foreground">
            <LockIcon aria-hidden strokeWidth={1.8} className="size-4 shrink-0" />
            <bdi dir="ltr" className="truncate text-foreground/85">
              /courses/{slug}
            </bdi>
          </p>
          <p className="text-xs text-muted-foreground">{SLUG_NOTE}</p>
        </div>
      )}

      {/*------ Family ------*/}
      <ChoicePills
        legend="خانواده"
        options={FAMILY_TABS.map((tab) => ({ value: tab.family, label: tab.label }))}
        registration={register("family")}
        error={errors.family}
      />

      {/*------ Summary ------*/}
      <Field data-invalid={!!errors.summary} className="gap-2">
        <FieldLabel htmlFor="course-summary">توضیح کوتاه</FieldLabel>
        <Textarea
          id="course-summary"
          rows={3}
          className="min-h-24 text-sm"
          aria-invalid={!!errors.summary}
          aria-describedby={describedBy({ id: "course-summary", hint: true, error: !!errors.summary })}
          {...register("summary")}
        />
        <FieldHint
          id="course-summary"
          className={cn("tabular-nums", summaryLength > COURSE_SUMMARY_MAX_LENGTH && "text-destructive")}
        >
          {formatNumberFa(summaryLength)} از {formatNumberFa(COURSE_SUMMARY_MAX_LENGTH)} حرف؛ کارت فقط دو خط اولش رو
          نشون می‌ده.
        </FieldHint>
        <FieldMessage id="course-summary" message={errors.summary?.message} />
      </Field>
    </FormSection>
  );
}
