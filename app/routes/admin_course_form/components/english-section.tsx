import { useFormContext } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_course_form/components/field-parts";
import { FormSection } from "~/routes/admin_course_form/components/form-section";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== English Section =====*/
/**
 * «متن انگلیسی»: the course's text on the English pages (`/en`, docs/i18n/english-version-plan.md). Every field is
 * optional: one left empty shows its Persian on the English page. The form itself stays Persian; the fields are typed
 * left to right.
 */
export function EnglishSection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CourseFormInput>();

  return (
    <FormSection id="english" description="برای صفحه‌های انگلیسی سایت. هر کدوم خالی بمونه، همون متن فارسی نشون داده می‌شه.">
      {/*------ Title and summary ------*/}
      <Field data-invalid={!!errors.titleEn} className="gap-2">
        <FieldLabel htmlFor="course-titleEn">نام انگلیسی</FieldLabel>
        <Input
          id="course-titleEn"
          dir="ltr"
          lang="en"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.titleEn}
          aria-describedby={describedBy({ id: "course-titleEn", hint: true, error: !!errors.titleEn })}
          {...register("titleEn")}
        />
        <FieldHint id="course-titleEn">
          نام دوره به انگلیسی، مثلاً <bdi dir="ltr">House Dog</bdi>؛ نام لاتین زیرش جدا میاد.
        </FieldHint>
        <FieldMessage id="course-titleEn" message={errors.titleEn?.message} />
      </Field>

      <Field data-invalid={!!errors.summaryEn} className="gap-2">
        <FieldLabel htmlFor="course-summaryEn">توضیح کوتاه انگلیسی</FieldLabel>
        <Textarea
          id="course-summaryEn"
          dir="ltr"
          lang="en"
          rows={3}
          className="min-h-24 text-sm"
          aria-invalid={!!errors.summaryEn}
          aria-describedby={describedBy({ id: "course-summaryEn", error: !!errors.summaryEn })}
          {...register("summaryEn")}
        />
        <FieldMessage id="course-summaryEn" message={errors.summaryEn?.message} />
      </Field>

      <Field data-invalid={!!errors.coverAltEn} className="gap-2">
        <FieldLabel htmlFor="course-coverAltEn">توضیح انگلیسی عکس</FieldLabel>
        <Input
          id="course-coverAltEn"
          dir="ltr"
          lang="en"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.coverAltEn}
          aria-describedby={describedBy({ id: "course-coverAltEn", error: !!errors.coverAltEn })}
          {...register("coverAltEn")}
        />
        <FieldMessage id="course-coverAltEn" message={errors.coverAltEn?.message} />
      </Field>

      {/*------ The two lists ------*/}
      <Field data-invalid={!!errors.highlightsEn} className="gap-2">
        <FieldLabel htmlFor="course-highlightsEn">نتیجه‌ها به انگلیسی</FieldLabel>
        <Textarea
          id="course-highlightsEn"
          dir="ltr"
          lang="en"
          rows={4}
          className="min-h-28 text-sm"
          aria-invalid={!!errors.highlightsEn}
          aria-describedby={describedBy({ id: "course-highlightsEn", hint: true, error: !!errors.highlightsEn })}
          {...register("highlightsEn")}
        />
        <FieldHint id="course-highlightsEn">هر مورد یه خط، به همون ترتیب فارسی.</FieldHint>
        <FieldMessage id="course-highlightsEn" message={errors.highlightsEn?.message} />
      </Field>

      <Field data-invalid={!!errors.commandsEn} className="gap-2">
        <FieldLabel htmlFor="course-commandsEn">فرمان‌ها و سرفصل‌ها به انگلیسی</FieldLabel>
        <Textarea
          id="course-commandsEn"
          dir="ltr"
          lang="en"
          rows={8}
          className="min-h-48 text-sm"
          aria-invalid={!!errors.commandsEn}
          aria-describedby={describedBy({ id: "course-commandsEn", hint: true, error: !!errors.commandsEn })}
          {...register("commandsEn")}
        />
        <FieldHint id="course-commandsEn">هر مورد یه خط، به همون ترتیب فارسی.</FieldHint>
        <FieldMessage id="course-commandsEn" message={errors.commandsEn?.message} />
      </Field>
    </FormSection>
  );
}
