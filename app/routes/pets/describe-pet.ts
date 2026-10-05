import { formatNumberFa } from "~/lib/digits";
import { PET_SPECIES_LABELS } from "~/orpc/pet/constants";
import type { Pet } from "~/orpc/pet/contract";

/*===== Pet Summary =====*/
/**
 * One-line summary under a pet's name: breed (or species when unknown) and age, e.g.
 * "گلدن رتریور، ۳ ساله".
 */
export function describePet(pet: Pick<Pet, "species" | "breed" | "ageYears">): string {
  const parts = [pet.breed ?? PET_SPECIES_LABELS[pet.species]];

  if (pet.ageYears !== null) {
    parts.push(pet.ageYears === 0 ? "کمتر از یک سال" : `${formatNumberFa(pet.ageYears)} ساله`);
  }

  return parts.join("، ");
}

/*===== Family Names =====*/
const faList = new Intl.ListFormat("fa", { type: "conjunction" });

const MAX_NAMED_PETS = 3;

/**
 * Names pets the way a person would: "لئو، میشا و تیرا". Past three names, the rest are counted
 * ("لئو، میشا و ۲ حیوان دیگر") so the headline stays one or two lines.
 */
export function formatPetNames(names: string[]): string {
  if (names.length <= MAX_NAMED_PETS) return faList.format(names);

  const shown = names.slice(0, MAX_NAMED_PETS - 1);
  return faList.format([...shown, `${formatNumberFa(names.length - shown.length)} حیوان دیگر`]);
}
