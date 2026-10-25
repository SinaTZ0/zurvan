import { cn } from "cn";
import { CircleAlertIcon } from "lucide-react";

/*===== Field Parts =====*/
// The lines under a field, in the course form's look (copied from it, since slices don't share): a muted `text-xs`
// hint, and an error in destructive with an icon. Each takes an id derived from its field's (`<field>-hint`,
// `<field>-error`), so the input can point at both with `aria-describedby` (`describedBy`).

/** The ids an input describes itself with: its hint when there is one, then its message when there is one. */
export function describedBy({
  id,
  hint = false,
  error = false,
}: {
  id: string;
  hint?: boolean;
  error?: boolean;
}): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

/** A field's hint: muted and small, under the field. */
export function FieldHint({
  id,
  className,
  children,
}: {
  /** The field's id; the hint takes `<id>-hint`. */
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p id={`${id}-hint`} className={cn("text-xs leading-relaxed text-pretty text-muted-foreground", className)}>
      {children}
    </p>
  );
}

/**
 * A field's message, in destructive with its icon. It rises in when it appears or says something new (keyed by the
 * message), so a second wrong try on the same field still answers; never on load, since a fresh form has none.
 */
export function FieldMessage({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;

  return (
    <p
      key={message}
      id={`${id}-error`}
      role="alert"
      className="answer-in flex items-start gap-1.5 text-sm text-pretty text-destructive"
    >
      <CircleAlertIcon aria-hidden strokeWidth={1.8} className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
