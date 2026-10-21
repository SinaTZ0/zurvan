import { FormAlert } from "~/components/form-alert";

/*===== Step Alert =====*/
/**
 * The form-level error of a step (`FormAlert`), arriving instead of appearing: it rises in a few pixels as it fades in.
 * The wrapper exists only while there is a message, so the form's gaps never leave a hole, and it is keyed by the message,
 * so a different message plays the arrival again. (A retry that fails the same way clears the error on submit and sets
 * it again, which mounts it afresh.)
 */
export function StepAlert({ message }: { message: string | undefined }) {
  if (!message) return null;

  return (
    <div key={message} className="answer-in">
      <FormAlert message={message} />
    </div>
  );
}
