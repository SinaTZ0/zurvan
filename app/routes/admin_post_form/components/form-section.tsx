import { cn } from "cn";
import { useFormState } from "react-hook-form";

import { ADMIN_PLATE } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { PostFormInput } from "~/routes/admin_post_form/schema";
import {
  POST_FORM_SECTIONS,
  type PostFormSectionId,
  sectionAnchor,
  sectionTitle,
} from "~/routes/admin_post_form/sections";

/*===== Form Section =====*/
/**
 * One plate of the post form, as the course form's: the Admin's grained plate with an Estedad `h2` and its fields. The
 * plates are not numbered, because she jumps to whichever one the change is in (the contents list beside the form
 * links each by its anchor). A plate that holds a message gets a destructive hairline, so a long form shows from afar
 * where the problem is.
 */
export function FormSection({
  id,
  description,
  className,
  children,
}: {
  id: PostFormSectionId;
  /** One muted line under the heading, when the plate needs it. */
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const { errors } = useFormState<PostFormInput>();
  const fields = POST_FORM_SECTIONS.find((section) => section.id === id)?.fields ?? [];
  const hasError = fields.some((field) => errors[field]);
  const anchor = sectionAnchor(id);

  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      className={cn(
        ADMIN_PLATE,
        "min-w-0 scroll-mt-24 p-5 transition-colors sm:p-6",
        hasError && "border-destructive/50",
        className,
      )}
    >
      <h2 id={`${anchor}-title`} className={cn(DISPLAY_HEADING, "text-xl text-balance")}>
        {sectionTitle(id)}
      </h2>
      {description && <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>}
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
