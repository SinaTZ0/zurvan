import { useId } from "react";

import type { DogFormSection } from "~/routes/account_dog_form/sections";

/*===== Form Section =====*/
/**
 * One part of the dog form: a heading, the one-line reason it is asked, and its fields. Ruled with a hairline under
 * the heading rather than boxed, so the three parts read as one sheet. Focus anywhere inside reports the section, so
 * the dog's bubble can answer where the owner is (React's `onFocus` bubbles).
 */
export function FormSection({
  id,
  title,
  description,
  onFocusSection,
  children,
}: {
  id: DogFormSection;
  title: string;
  description: string;
  onFocusSection: (id: DogFormSection) => void;
  children: React.ReactNode;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <h2 id={headingId} className="text-lg font-extrabold">
        {title}
      </h2>
      <p className="mt-1 border-b pb-3 text-sm text-pretty text-muted-foreground">{description}</p>
      {/* The listener sits on the fields' column, not the `section`: that is where focus can land, and a landmark-like
          element with a handler trips the a11y lint. Focus events bubble up to it from every field. */}
      <div className="mt-6 flex flex-col gap-6" onFocus={() => onFocusSection(id)}>
        {children}
      </div>
    </section>
  );
}
