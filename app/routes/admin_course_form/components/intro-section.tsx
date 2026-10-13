import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { formatNumberFa } from "~/lib/digits";
import { FAMILY_TABS } from "~/lib/course-families";
import { COURSE_SUMMARY_MAX_LENGTH } from "~/orpc/course/validation";
import { ChoicePills } from "~/routes/admin_course_form/components/choice-pills";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import { type CourseFormInput, slugFromLatinName } from "~/routes/admin_course_form/schema";

const SLUG_NOTE = "بعد از ساخته شدن عوض نمی‌شود.";

/*===== Intro Section =====*/
/**
 * «معرفی دوره»: the name, the latin name the card prints, the family, a short summary and, for a new course, its
 * address. The address starts as the latin name in kebab-case and follows it until he types in it himself; an edited
 * course shows its address as plain text, because carts and links already hold it.
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
    <FormSection title="معرفی دوره">
      {/*------ Name ------*/}
      <Field data-invalid={!!errors.title}>
        <FieldLabel htmlFor="course-title">نام دوره</FieldLabel>
        <Input
          id="course-title"
          autoComplete="off"
          placeholder="مثلاً سگ خونگی"
          className="h-11 text-sm"
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        <FieldError errors={[errors.title]} />
      </Field>

      {/*------ Latin Name ------*/}
      <Field data-invalid={!!errors.latinName}>
        <FieldLabel htmlFor="course-latin-name">نام لاتین</FieldLabel>
        <Input
          id="course-latin-name"
          dir="ltr"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.latinName}
          {...register("latinName", {
            onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              if (slug === null && !slugEdited) {
                setValue("slug", slugFromLatinName(event.target.value), { shouldValidate: isSubmitted });
              }
            },
          })}
        />
        <FieldDescription>همان نامی که روی کارت دوره می‌آید: House manner، CGC.</FieldDescription>
        <FieldError errors={[errors.latinName]} />
      </Field>

      {/*------ Address ------*/}
      {slug === null ? (
        <Field data-invalid={!!errors.slug}>
          <FieldLabel htmlFor="course-slug">نشانی صفحه</FieldLabel>
          <Input
            id="course-slug"
            dir="ltr"
            autoComplete="off"
            className="h-11 text-sm"
            aria-invalid={!!errors.slug}
            {...register("slug", { onChange: () => setSlugEdited(true) })}
          />
          <FieldDescription>
            <bdi dir="ltr">…/courses/{typedSlug || "…"}</bdi> {SLUG_NOTE}
          </FieldDescription>
          <FieldError errors={[errors.slug]} />
        </Field>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold">نشانی صفحه</p>
          <p className="text-sm text-muted-foreground">
            <bdi dir="ltr">…/courses/{slug}</bdi>
          </p>
          <p className="text-sm text-muted-foreground">{SLUG_NOTE}</p>
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
      <Field data-invalid={!!errors.summary}>
        <FieldLabel htmlFor="course-summary">توضیح کوتاه</FieldLabel>
        <Textarea
          id="course-summary"
          rows={3}
          className="min-h-24 text-sm"
          aria-invalid={!!errors.summary}
          {...register("summary")}
        />
        <p
          className={
            summaryLength > COURSE_SUMMARY_MAX_LENGTH ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {formatNumberFa(summaryLength)} از {formatNumberFa(COURSE_SUMMARY_MAX_LENGTH)}
        </p>
        <FieldError errors={[errors.summary]} />
      </Field>
    </FormSection>
  );
}
