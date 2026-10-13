import { useId } from "react";

/*===== Form Section =====*/
/**
 * One card of the course form: an `h2` and its fields. The sections are not numbered, because they are not a sequence:
 * he jumps to whichever one the change is in.
 */
export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="min-w-0 rounded-2xl border border-border p-5">
      <h2 id={headingId} className="font-sans text-lg font-extrabold">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}
