import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";

import { addCartItemAtom, cartItemsAtom, isInCart } from "~/atoms/cart";
import { useHydrated } from "~/hooks/use-hydrated";
import { getDogVerdict, type DogVerdict } from "~/lib/dog-verdict";
import type { DogEligibility } from "~/orpc/checkout/contract";
import type { Course } from "~/orpc/course/contract";

/*===== Types =====*/
/** Who is looking: nobody signed in, a customer with a name, or a partner/Admin (who can't buy). */
export type Viewer = "visitor" | "customer" | "other";

/**
 * What the card is about, from the viewer and the course:
 * - `evaluation`: nothing to buy here (no price, or a partner/Admin): the free evaluation is the way in.
 * - `visitor`: signed out, can't know which dog qualifies yet.
 * - `no-dogs`: a customer with no dog to buy for.
 * - `dogs`: a customer with dogs: the list, the verdict and the cart.
 */
export type BuyMode = "evaluation" | "visitor" | "no-dogs" | "dogs";

/** The one main button, as a state. The card and the phone bar both draw it. */
export type BuyAction =
  | { kind: "link"; label: string; to: string }
  /** Several dogs and none picked yet. */
  | { kind: "pick" }
  /** The picked dog can't take the course. */
  | { kind: "blocked" }
  | { kind: "add" }
  | { kind: "in-cart" };

export type BuyCardState = {
  mode: BuyMode;
  action: BuyAction;
  /** The outline button under the main one (signed out only). */
  quieter: { label: string; to: string } | null;
  dogs: readonly DogEligibility[];
  /** The picked dog's id, or null. A customer with exactly one dog has it picked from the start. */
  pickedId: string | null;
  verdict: DogVerdict | null;
  pick: (dogId: string) => void;
  add: () => void;
  /** What the last add said, for the live region. */
  message: "added" | "full" | null;
};

/*===== Buy Card State =====*/
/**
 * Everything the buy card and the phone action bar agree on, so they can never show different buttons. Called once, by
 * the page.
 *
 * The cart is browser-only: it is read only after hydration (the server and the hydration render have an empty one),
 * and this hook always subscribes to it, which also makes the cart load from storage before the first add.
 */
export function useBuyCard({
  course,
  viewer,
  eligibility,
}: {
  course: Course;
  viewer: Viewer;
  eligibility: readonly DogEligibility[];
}): BuyCardState {
  const items = useAtomValue(cartItemsAtom);
  const addToCart = useSetAtom(addCartItemAtom);
  const hydrated = useHydrated();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [message, setMessage] = useState<BuyCardState["message"]>(null);

  /*------ Mode ------*/
  const mode: BuyMode =
    course.price === null || viewer === "other"
      ? "evaluation"
      : viewer === "visitor"
        ? "visitor"
        : eligibility.length === 0
          ? "no-dogs"
          : "dogs";

  /*------ Picked Dog ------*/
  // Derived, not stored: if the loader reloads and the chosen dog is gone, nothing stale is left behind.
  const picked =
    eligibility.find((entry) => entry.dog.id === chosenId) ?? (eligibility.length === 1 ? eligibility[0] : undefined);
  const verdict = picked ? getDogVerdict({ ...picked, dogId: picked.dog.id }) : null;
  const inCart = hydrated && picked !== undefined && isInCart(items, { courseSlug: course.slug, dogId: picked.dog.id });

  /*------ Main Action ------*/
  const action: BuyAction = (() => {
    switch (mode) {
      case "evaluation":
        return { kind: "link", label: "ارزیابی رایگان", to: "/assessment" };
      case "visitor":
        return {
          kind: "link",
          label: "ورود و افزودن به سبد",
          to: `/auth?redirectTo=${encodeURIComponent(`/courses/${course.slug}`)}`,
        };
      case "no-dogs":
        return {
          kind: "link",
          label: "معرفی سگ",
          to: `/account/dogs/new?redirectTo=${encodeURIComponent(`/courses/${course.slug}`)}`,
        };
      case "dogs":
        if (!verdict) return { kind: "pick" };
        if (!verdict.can) return { kind: "blocked" };
        return inCart ? { kind: "in-cart" } : { kind: "add" };
    }
  })();

  return {
    mode,
    action,
    quieter: mode === "visitor" ? { label: "ارزیابی رایگان", to: "/assessment" } : null,
    dogs: eligibility,
    pickedId: picked?.dog.id ?? null,
    verdict,
    pick: (dogId) => {
      setChosenId(dogId);
      setMessage(null);
    },
    add: () => {
      if (!picked || !verdict?.can) return;
      const result = addToCart({ courseSlug: course.slug, dogId: picked.dog.id });
      // A duplicate is already what the customer wants: the button says «در سبد است» and there is nothing to add.
      setMessage(result === "added" ? "added" : result === "full" ? "full" : null);
    },
    message,
  };
}
