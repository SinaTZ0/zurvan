import type { Assessment } from "~/orpc/assessment/contract";
import type { Dog } from "~/orpc/dog/contract";

/*===== Dog Choices =====*/
// Which of the customer's dogs can book a free assessment. The API refuses the rest (`HAS_RECORD`,
// `ALREADY_BOOKED`); the page says why up front instead of letting them find out on submit.

export type DogAvailability =
  | { kind: "open" }
  /** Already assessed (or known to Arman): it books its next course instead. */
  | { kind: "record" }
  /** Has a booked assessment already, at `startsAt`. */
  | { kind: "booked"; startsAt: Date };

export type DogChoice = { dog: Dog; availability: DogAvailability };

/**
 * Pairs each dog with whether it can book. A record wins over a booking: a dog with a record is out whatever its
 * assessments say.
 */
export function toDogChoices({ dogs, assessments }: { dogs: readonly Dog[]; assessments: readonly Assessment[] }) {
  const bookedStart = new Map<string, Date>();
  for (const assessment of assessments) {
    if (assessment.status === "booked") bookedStart.set(assessment.dog.id, assessment.startsAt);
  }

  return dogs.map((dog): DogChoice => {
    if (dog.hasRecord) return { dog, availability: { kind: "record" } };
    const startsAt = bookedStart.get(dog.id);
    return { dog, availability: startsAt ? { kind: "booked", startsAt } : { kind: "open" } };
  });
}

/** The dog the form starts on: the one named by `?dog=` if it can book, or the only one that can. */
export function pickInitialDog({
  choices,
  requestedId,
}: {
  choices: readonly DogChoice[];
  requestedId: string | null;
}) {
  const open = choices.filter((choice) => choice.availability.kind === "open");
  const requested = open.find((choice) => choice.dog.id === requestedId);
  if (requested) return requested.dog.id;
  return open.length === 1 ? (open[0]?.dog.id ?? "") : "";
}
