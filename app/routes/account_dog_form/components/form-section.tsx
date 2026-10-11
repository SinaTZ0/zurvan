/*===== Form Section =====*/
/**
 * One part of the dog form: a legend, the one-line reason it is asked, and its fields. Ruled rather than boxed, so the
 * three parts read as one sheet.
 */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    // The legend stays the fieldset's first child so it names the group; the fields sit in their own flex column.
    <fieldset className="min-w-0">
      <legend className="text-lg font-extrabold">{title}</legend>
      <p className="mt-1 border-b pb-3 text-sm text-pretty text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}
