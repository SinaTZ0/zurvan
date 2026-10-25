import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";
import { BLOG_CATEGORIES } from "~/orpc/blog/constants";
import type { AdminCourse } from "~/orpc/course/contract";
import { ChoicePills } from "~/routes/admin_post_form/components/choice-pills";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_post_form/components/field-parts";
import { FormSection } from "~/routes/admin_post_form/components/form-section";
import { CATEGORY_LABELS } from "~/routes/admin_post_form/labels";
import type { PostFormInput } from "~/routes/admin_post_form/schema";

/*===== Details Section =====*/
/**
 * «جزئیات»: the address, the blog's section and the course the article closes with.
 *
 * - **Address:** Latin, typed left to right. A new post's address follows the English title until she types in it
 *   (a Persian title has no sensible Latin form). It can change later; once a post has been public, its old address
 *   keeps leading to it (the server keeps it as a redirect), and the hint says so.
 * - **Course:** courses on sale, plus the one already chosen if it has been archived since (the article then shows
 *   the free evaluation instead, and the option says so).
 */
export function DetailsSection({
  savedSlug,
  everPublished,
  courses,
  onSlugTyped,
}: {
  /** The saved address on edit, or null for a new post. */
  savedSlug: string | null;
  /** The post has been public at some point, so a changed address leaves a redirect behind. */
  everPublished: boolean;
  courses: AdminCourse[];
  /** She typed in the address: it stops following the English title. */
  onSlugTyped: () => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostFormInput>();
  const typedSlug = (useWatch({ control, name: "slug" }) ?? "").trim();
  const chosenCourse = useWatch({ control, name: "relatedCourseSlug" }) ?? "";

  const options = courses.filter((course) => course.status === "approved" || course.slug === chosenCourse);
  const moved = savedSlug !== null && everPublished && typedSlug !== "" && typedSlug !== savedSlug;

  return (
    <FormSection id="details">
      {/*------ Address ------*/}
      <Field data-invalid={!!errors.slug} className="gap-2">
        <FieldLabel htmlFor="post-slug">نشانی صفحه</FieldLabel>
        <div
          className="flex h-11 min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive dark:bg-input/30"
          dir="ltr"
        >
          <span className="flex shrink-0 items-center border-e border-foreground/10 px-3 text-sm text-muted-foreground select-none">
            /blog/
          </span>
          <Input
            id="post-slug"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            placeholder="first-week-with-a-puppy"
            className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            aria-invalid={!!errors.slug}
            aria-describedby={describedBy({ id: "post-slug", hint: true, error: !!errors.slug })}
            {...register("slug", { onChange: onSlugTyped })}
          />
        </div>
        <FieldHint id="post-slug">
          {moved ? (
            <>
              نشانی قبلی، <bdi dir="ltr">/blog/{savedSlug}</bdi>، بعد از ذخیره به نشانی تازه می‌رسه؛ پیوندهای قدیمی کار
              می‌کنن.
            </>
          ) : savedSlug === null ? (
            "حرف کوچیک انگلیسی و خط تیره. با نوشتن عنوان انگلیسی خودش پر می‌شه، یا خودت بنویسش."
          ) : (
            "حرف کوچیک انگلیسی و خط تیره."
          )}
        </FieldHint>
        <FieldMessage id="post-slug" message={errors.slug?.message} />
      </Field>

      {/*------ Section ------*/}
      <ChoicePills
        legend="بخش"
        options={BLOG_CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] }))}
        registration={register("category")}
        error={errors.category}
      />

      {/*------ Course ------*/}
      <Field data-invalid={!!errors.relatedCourseSlug} className="gap-2">
        <FieldLabel htmlFor="post-relatedCourseSlug">دوره‌ی آخر نوشته</FieldLabel>
        <NativeSelect
          id="post-relatedCourseSlug"
          size="sm"
          className="w-full sm:max-w-sm"
          aria-invalid={!!errors.relatedCourseSlug}
          aria-describedby={describedBy({
            id: "post-relatedCourseSlug",
            hint: true,
            error: !!errors.relatedCourseSlug,
          })}
          {...register("relatedCourseSlug")}
        >
          <NativeSelectOption value="">بدون دوره: دعوت به ارزیابی رایگان</NativeSelectOption>
          {options.map((course) => (
            <NativeSelectOption key={course.slug} value={course.slug}>
              {course.status === "approved" ? course.title : `${course.title} (بایگانی‌شده؛ نشون داده نمی‌شه)`}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldHint id="post-relatedCourseSlug">
          کارت این دوره آخر نوشته میاد. بدون دوره، خواننده به ارزیابی رایگان دعوت می‌شه.
        </FieldHint>
        <FieldMessage id="post-relatedCourseSlug" message={errors.relatedCourseSlug?.message} />
      </Field>
    </FormSection>
  );
}
