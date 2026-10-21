import { FormAlert } from "~/components/form-alert";

/*===== Rising Alert =====*/
/**
 * A card's form-level error (`FormAlert`, which announces itself), rising in when it appears and again when the message
 * changes (keyed by it). Sits directly above the save button, where the eye is after pressing it.
 */
export function RisingAlert({ message }: { message: string | undefined }) {
  if (!message) return null;
  return (
    <div key={message} className="answer-in">
      <FormAlert message={message} />
    </div>
  );
}
