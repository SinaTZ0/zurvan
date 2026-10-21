import { cn } from "cn";
import { useFormState } from "react-hook-form";

import { ADMIN_PLATE } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import {
  type CourseFormSectionId,
  COURSE_FORM_SECTIONS,
  sectionAnchor,
  sectionTitle,
} from "~/routes/admin_course_form/sections";
import type { CourseFormInput } from "~/routes/admin_course_form/schema";

/*===== Form Section =====*/
/**
 * One plate of the course form: the Admin's grained plate with an Estedad `h2` and its fields. The plates are not
 * numbered, because they are not a sequence: he jumps to whichever one the change is in (the contents list beside the
 * card links each by its anchor). A plate that holds a message gets a destructive hairline, so a long form shows from
 * afar where the problem is.
 */
export function FormSection({
  id,
  description,
  className,
  children,
}: {
  id: CourseFormSectionId;
  /** One muted line under the heading, when the plate needs it. */
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const { errors } = useFormState<CourseFormInput>();
  const fields = COURSE_FORM_SECTIONS.find((section) => section.id === id)?.fields ?? [];
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
