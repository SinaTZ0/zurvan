import { CircleAlertIcon } from "lucide-react";

import { FieldError } from "~/components/ui/field";

/*===== Rising Error =====*/
/**
 * A field's error under it, rising in when it appears or changes (the shared `answer-in`, keyed by the message). The
 * wrapper with the field's `aria-describedby` id is always rendered, so the reference never dangles; `FieldError` is a
 * `role="alert"`, so the message is announced as it arrives.
 */
export function RisingError({ id, message }: { id: string; message: string | undefined }) {
  return (
    <div id={id} className="mt-2 empty:hidden">
      {message && (
        <FieldError key={message} className="answer-in flex items-start gap-1.5">
          <CircleAlertIcon aria-hidden strokeWidth={2} className="mt-0.5 size-4 shrink-0" />
          <span>{message}</span>
        </FieldError>
      )}
    </div>
  );
}
