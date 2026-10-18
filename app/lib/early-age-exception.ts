/*===== Early-age Exception =====*/
// Every dog needs the free evaluation before it can buy a course (docs/app-spec.md, F3 and F4). The owner has described
// one exception: a very young dog that is **not** of a working breed may start one of three introductory courses without
// it. The facts that make that rule safe are **not confirmed**: the exact age bounds, which three courses, and which
// breeds count as working. They are not guessed here: this is `null`, so the exception is **off**, and with it off every
// dog needs the evaluation (it fails closed). Writing the facts down is the owner's call
// (`docs/overnight/03-DECISIONS-NEEDED.md`).
//
// To turn it on once the owner has confirmed the facts: replace `null` with an object and deploy. Nothing else needs
// changing; the eligibility check (`checkEligibility`) reads it, and so do the cart, «پرداخت» and the payment callback.

export type EarlyAgeException = {
  /** Whole months, inclusive: the youngest and the oldest age at which the exception applies. */
  minMonths: number;
  maxMonths: number;
  /** The slugs of the introductory courses the exception covers. Any other course still needs the evaluation. */
  courseSlugs: readonly string[];
  /**
   * The breeds the owner counts as working breeds: a dog whose breed matches one never qualifies. Compared the way search
   * compares (Persian letters, spaces and half-spaces folded), and a dog with no breed written never qualifies either:
   * a breed nobody has classified is not assumed to be harmless.
   */
  workingBreeds: readonly string[];
};

export const EARLY_AGE_EXCEPTION: EarlyAgeException | null = null;
