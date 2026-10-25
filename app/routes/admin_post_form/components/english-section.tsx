import { cn } from "cn";
import { CheckIcon } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { BlogBody } from "~/lib/blog-body";
import { LazyBodyEditor } from "~/routes/admin_post_form/components/editor/lazy-body-editor";
import { ExcerptCounter } from "~/routes/admin_post_form/components/excerpt-counter";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_post_form/components/field-parts";
import { FormSection } from "~/routes/admin_post_form/components/form-section";
import type { PostFormInput } from "~/routes/admin_post_form/schema";

/*===== Types =====*/
/** Which of the four English parts have words in them. */
export type EnglishParts = { title: boolean; excerpt: boolean; coverAlt: boolean; body: boolean };

const PART_LABELS: { key: keyof EnglishParts; label: string }[] = [
  { key: "title", label: "عنوان" },
  { key: "excerpt", label: "خلاصه" },
  { key: "coverAlt", label: "توضیح عکس" },
  { key: "body", label: "متن" },
];

/*===== English Section =====*/
/**
 * «انگلیسی»: the post on the English site (`/en/blog/…`). Unlike a course's, it is all or nothing: the English page
 * exists only when all four parts are written, and a half-written English blocks publishing (the server names the
 * missing parts). So the plate opens with a line that says it, and a row of the four parts, each ticked once written,
 * with what that means right now. The fields are typed left to right; the form itself stays Persian.
 */
export function EnglishSection({
  parts,
  slug,
  live,
  initialBody,
  editable,
  onBodyChange,
}: {
  parts: EnglishParts;
  /** The address as typed, for the English page's address. */
  slug: string;
  /** The post is published, so a whole English is already on the English site. */
  live: boolean;
  initialBody: BlogBody | null;
  editable: boolean;
  onBodyChange: (json: unknown) => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostFormInput>();
  const excerptLength = (useWatch({ control, name: "excerptEn" }) ?? "").trim().length;
  const written = PART_LABELS.filter((part) => parts[part.key]).length;

  return (
    <FormSection
      id="english"
      description="برای سایت انگلیسی. یا هر چهارتا رو بنویس، یا هیچ‌کدوم: صفحه‌ی انگلیسی فقط وقتی ساخته می‌شه که عنوان، خلاصه، توضیح عکس و متن همه نوشته شده باشن."
    >
      {/*------ The Four Parts ------*/}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-dashed border-foreground/20 px-4 py-3">
        <ul aria-label="بخش‌های انگلیسی" className="flex flex-wrap gap-1.5">
          {PART_LABELS.map((part) => (
            <li
              key={part.key}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors motion-reduce:transition-none",
                parts[part.key]
                  ? "border-foreground/30 text-foreground"
                  : "border-dashed border-foreground/20 text-muted-foreground",
              )}
            >
              {parts[part.key] && (
                <CheckIcon
                  key="tick"
                  aria-hidden
                  strokeWidth={2.4}
                  className="answer-pop size-3.5 [--pop-origin:50%_50%]"
                />
              )}
              {part.label}
              <span className="sr-only">{parts[part.key] ? "، نوشته شده" : "، خالی"}</span>
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="text-sm leading-6 text-pretty">
          {written === 0 ? (
            <span className="text-muted-foreground">هنوز انگلیسی نداره؛ فقط صفحه‌ی فارسی منتشر می‌شه.</span>
          ) : written === 4 ? (
            <span className="text-foreground/90">
              {live ? "کامله؛ صفحه‌ی انگلیسیش، " : "کامله؛ با انتشار، "}
              <bdi dir="ltr">/en/blog/{slug || "…"}</bdi>
              {live ? "، هم توی سایته." : " هم ساخته می‌شه."}
            </span>
          ) : (
            <span className="text-foreground/90">نصفه‌ست. تا بقیه رو ننویسی (یا همه رو خالی نکنی)، منتشر نمی‌شه.</span>
          )}
        </p>
      </div>

      {/*------ Title ------*/}
      <Field data-invalid={!!errors.titleEn} className="gap-2">
        <FieldLabel htmlFor="post-titleEn">عنوان انگلیسی</FieldLabel>
        <Input
          id="post-titleEn"
          dir="ltr"
          lang="en"
          autoComplete="off"
          className="h-12 text-base font-bold"
          aria-invalid={!!errors.titleEn}
          aria-describedby={describedBy({ id: "post-titleEn", error: !!errors.titleEn })}
          {...register("titleEn")}
        />
        <FieldMessage id="post-titleEn" message={errors.titleEn?.message} />
      </Field>

      {/*------ Excerpt ------*/}
      <Field data-invalid={!!errors.excerptEn} className="gap-2">
        <FieldLabel htmlFor="post-excerptEn">خلاصه‌ی انگلیسی</FieldLabel>
        <Textarea
          id="post-excerptEn"
          dir="ltr"
          lang="en"
          rows={3}
          className="min-h-24 text-sm leading-7"
          aria-invalid={!!errors.excerptEn}
          aria-describedby={describedBy({ id: "post-excerptEn", hint: true, error: !!errors.excerptEn })}
          {...register("excerptEn")}
        />
        <ExcerptCounter id="post-excerptEn" length={excerptLength} />
        <FieldMessage id="post-excerptEn" message={errors.excerptEn?.message} />
      </Field>

      {/*------ Cover Description ------*/}
      <Field data-invalid={!!errors.coverAltEn} className="gap-2">
        <FieldLabel htmlFor="post-coverAltEn">توضیح انگلیسی عکس</FieldLabel>
        <Input
          id="post-coverAltEn"
          dir="ltr"
          lang="en"
          autoComplete="off"
          className="h-11 text-sm"
          aria-invalid={!!errors.coverAltEn}
          aria-describedby={describedBy({ id: "post-coverAltEn", error: !!errors.coverAltEn })}
          {...register("coverAltEn")}
        />
        <FieldMessage id="post-coverAltEn" message={errors.coverAltEn?.message} />
      </Field>

      {/*------ Body ------*/}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold">متن انگلیسی</p>
        <LazyBodyEditor
          id="post-bodyEn"
          language="en"
          label="متن انگلیسی نوشته"
          describedBy={describedBy({ id: "post-bodyEn", hint: true, error: !!errors.bodyEn })}
          invalid={!!errors.bodyEn}
          initialBody={initialBody}
          placeholder="The same article in English…"
          editable={editable}
          compact
          onChange={onBodyChange}
        />
        <FieldHint id="post-bodyEn">عکس‌های متن انگلیسی جدا گذاشته می‌شن؛ توضیحشون رو انگلیسی بنویس.</FieldHint>
        <FieldMessage id="post-bodyEn" message={errors.bodyEn?.message} />
      </div>
    </FormSection>
  );
}
