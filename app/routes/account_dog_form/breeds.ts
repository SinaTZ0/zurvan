import { m } from "~/paraglide/messages";

/*===== Breed Suggestions =====*/
// Offered while typing the breed; any other text is fine too («Free text or from a list», spec entity 4). The breeds
// people in Iran most often bring for training, then the small house dogs, in their usual names in the page's language.
// They are one message split on "|", so the list is read while rendering and follows the page's language.

/** The breed suggestions in the page's language, in the order they are offered. */
export function breedSuggestions(): string[] {
  return m.account_dog_form_breeds().split("|");
}
