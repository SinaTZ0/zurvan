import { type DogEvaluationState, getDogEvaluationState } from "~/components/dog-evaluation-stamp";
import { normalizeForSearch } from "~/lib/search";
import type { AdminDog } from "~/orpc/dog/contract";
import type { DogStateFilter } from "~/routes/admin_dogs/search-params";

/*===== Matching =====*/
/** Drops one leading 0, so «9120…» and «09120…» compare equal. Applied to both sides of a phone comparison. */
function stripLeadingZero(digits: string): string {
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

/**
 * Whether a phone number matches what was typed. Typing it with or without the leading 0 both find it. The stripped
 * comparison needs something left to compare, so a lone «0» doesn't match every number.
 */
function matchesPhone({ phone, typed }: { phone: string | null; typed: string }): boolean {
  if (phone === null) return false;
  const digits = normalizeForSearch(phone);
  if (digits.includes(typed)) return true;
  const strippedTyped = stripLeadingZero(typed);
  return strippedTyped !== "" && stripLeadingZero(digits).includes(strippedTyped);
}

/**
 * Whether a dog matches the search. Each field is searched on its own, so a query can't match across the seam between
 * the dog's name and the owner's name.
 */
function matchesQuery({ dog, typed }: { dog: AdminDog; typed: string }): boolean {
  // The file number is on the dog's QR code and certificate, so it is what the Admin is handed when someone calls about one.
  const texts = [dog.name, dog.breed, dog.breedSecondary, dog.owner.name, dog.fileNumber];
  if (texts.some((text) => text !== null && normalizeForSearch(text).includes(typed))) return true;
  return matchesPhone({ phone: dog.owner.phoneNumber, typed });
}

/*===== Filtering =====*/
/**
 * The dogs the Admin is looking for: the status filter first, then the search. `waiting` is the set of dog ids with an
 * evaluation request the Admin hasn't answered; it only changes what a dog's state reads as, never which dogs exist.
 */
export function filterDogs({
  dogs,
  waiting,
  query,
  state,
}: {
  dogs: AdminDog[];
  waiting: ReadonlySet<string>;
  query: string;
  state: DogStateFilter;
}): AdminDog[] {
  const typed = normalizeForSearch(query);
  return dogs.filter((dog) => {
    const dogState = stateOf({ dog, waiting });
    if (state === "evaluated" && dogState !== "evaluated") return false;
    if (state === "none" && dogState === "evaluated") return false;
    return typed === "" || matchesQuery({ dog, typed });
  });
}

/** The counts for the status pills. They are over every dog, so they don't move with the search. */
export function countDogs({ dogs }: { dogs: AdminDog[] }): Record<DogStateFilter, number> {
  let evaluated = 0;
  for (const dog of dogs) if (dog.isEvaluated) evaluated += 1;
  return { all: dogs.length, evaluated, none: dogs.length - evaluated };
}

/** A dog's stamp: evaluated, else waiting when its request is still open, else not yet. */
export function stateOf({ dog, waiting }: { dog: AdminDog; waiting: ReadonlySet<string> }): DogEvaluationState {
  return getDogEvaluationState({ isEvaluated: dog.isEvaluated, hasWaitingRequest: waiting.has(dog.id) });
}
