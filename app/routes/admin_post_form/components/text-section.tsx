import { useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { BlogBody } from "~/lib/blog-body";
import { ExcerptCounter } from "~/routes/admin_post_form/components/excerpt-counter";
import { LazyBodyEditor } from "~/routes/admin_post_form/components/editor/lazy-body-editor";
import { FieldHint, FieldMessage, describedBy } from "~/routes/admin_post_form/components/field-parts";
import { FormSection } from "~/routes/admin_post_form/components/form-section";
import type { PostFormInput } from "~/routes/admin_post_form/schema";

/*===== Text Section =====*/
/**
 * «متن»: the title, the excerpt (under the title in the article and in Google's results, so it counts toward what
 * publishing needs), and the body in the editor. The plate's fields are the article's own order.
 */
export function TextSection({
  initialBody,
  editable,
  onBodyChange,
}: {
  initialBody: BlogBody | null;
  editable: boolean;
  onBodyChange: (json: unknown) => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PostFormInput>();
  const excerptLength = (useWatch({ control, name: "excerpt" }) ?? "").trim().length;

  return (
    <FormSection id="text">
      {/*------ Title ------*/}
      <Field data-invalid={!!errors.title} className="gap-2">
        <FieldLabel htmlFor="post-title">عنوان</FieldLabel>
        <Input
          id="post-title"
          autoComplete="off"
          placeholder="مثلاً هفته‌ی اول با توله"
          className="h-12 text-base font-bold"
          aria-invalid={!!errors.title}
          aria-describedby={describedBy({ id: "post-title", error: !!errors.title })}
          {...register("title")}
        />
        <FieldMessage id="post-title" message={errors.title?.message} />
      </Field>

      {/*------ Excerpt ------*/}
      <Field data-invalid={!!errors.excerpt} className="gap-2">
        <FieldLabel htmlFor="post-excerpt">خلاصه</FieldLabel>
        <Textarea
          id="post-excerpt"
          rows={3}
          className="min-h-24 text-sm leading-7"
          aria-invalid={!!errors.excerpt}
          aria-describedby={describedBy({ id: "post-excerpt", hint: true, error: !!errors.excerpt })}
          {...register("excerpt")}
        />
        <ExcerptCounter id="post-excerpt" length={excerptLength} />
        <FieldMessage id="post-excerpt" message={errors.excerpt?.message} />
      </Field>

      {/*------ Body ------*/}
      <div className="flex flex-col gap-2">
        <p id="post-body-label" className="text-sm font-bold">
          متن نوشته
        </p>
        <LazyBodyEditor
          id="post-body"
          language="fa"
          label="متن نوشته"
          describedBy={describedBy({ id: "post-body", hint: true, error: !!errors.body })}
          invalid={!!errors.body}
          initialBody={initialBody}
          placeholder="از این‌جا بنویس… هر پاراگراف یه فکر. تیترها با H2 و H3، نکته‌ی خودمونی با «سگ می‌گه»."
          editable={editable}
          onChange={onBodyChange}
        />
        <FieldHint id="post-body">
          تیترهای H2 فهرست مطالب نوشته رو می‌سازن. روی هر عکس بزنی، توضیح و زیرنویسش عوض می‌شه.
        </FieldHint>
        <FieldMessage id="post-body" message={errors.body?.message} />
      </div>
    </FormSection>
  );
}
