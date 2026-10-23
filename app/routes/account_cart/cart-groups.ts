import { getDogVerdict, type DogVerdict } from "~/lib/dog-verdict";
import { formatNumber } from "~/lib/locale-format";
import type { CartItem, ReviewedItem } from "~/orpc/checkout/contract";
import { m } from "~/paraglide/messages";

/*===== Types =====*/
/** The dog a group is about. */
export type CartDog = NonNullable<ReviewedItem["dog"]>;

/** A reviewed item that `checkout.pay` can take: its course is sold, the dog is the customer's and may take it. */
export type PayableItem = ReviewedItem & {
  course: NonNullable<ReviewedItem["course"]>;
  dog: CartDog;
  price: number;
};

/** One dog's bag: every cart item for that dog, in cart order. */
export type DogGroup = { dog: CartDog; items: ReviewedItem[]; payable: PayableItem[] };

/*===== Payable =====*/
/**
 * Whether an item goes to the gateway. The server's `eligible` is the rule; the null checks only narrow the type (an
 * eligible item always has its course, dog and price).
 */
export function isPayable(item: ReviewedItem): item is PayableItem {
  return item.eligible && item.course !== null && item.dog !== null && item.price !== null;
}

/*===== Current Items =====*/
/**
 * The reviewed items that are still in the cart, in the cart's order. The review lags a removal by one request (it is
 * keyed by the items), so the page filters it by the live cart: a removed row leaves at once.
 */
export function selectCartItems({
  reviewed,
  cart,
}: {
  reviewed: readonly ReviewedItem[];
  cart: readonly CartItem[];
}): ReviewedItem[] {
  return cart.flatMap((entry) => {
    const found = reviewed.find((item) => item.courseSlug === entry.courseSlug && item.dogId === entry.dogId);
    return found ? [found] : [];
  });
}

/*===== Grouping =====*/
/**
 * Splits the cart by dog, in order of first appearance. Items whose dog isn't the customer's (`dog: null`) can't be
 * shown under a dog, so they come back apart, for the page's one last group.
 */
export function groupByDog(items: readonly ReviewedItem[]): { groups: DogGroup[]; orphans: ReviewedItem[] } {
  const groups = new Map<string, DogGroup>();
  const orphans: ReviewedItem[] = [];

  for (const item of items) {
    if (item.dog === null) {
      orphans.push(item);
      continue;
    }
    const group = groups.get(item.dog.id) ?? { dog: item.dog, items: [], payable: [] };
    group.items.push(item);
    if (isPayable(item)) group.payable.push(item);
    groups.set(item.dog.id, group);
  }

  return { groups: [...groups.values()], orphans };
}

/*===== Summary =====*/
/** What the summary card counts: only what can be paid, and how many are left out. */
export function summarize(items: readonly ReviewedItem[]) {
  const payable = items.filter(isPayable);
  return {
    payable,
    dogCount: new Set(payable.map((item) => item.dogId)).size,
    unavailableCount: items.length - payable.length,
  };
}

/*===== Verdicts =====*/
/**
 * The server had nothing to say about an item that still can't be paid (its course isn't sold): say so ourselves. A
 * function, so the sentence is read in the page's language when the verdict is built, not when the module loads.
 */
function notForSaleProblem() {
  return { kind: "not-for-sale", message: m.account_cart_not_for_sale(), courseSlug: null } as const;
}

/** The dog's first-person line and the reasons for an item that can't be paid, with the way out of each. */
export function getUnavailableVerdict(item: ReviewedItem): DogVerdict {
  return getDogVerdict({
    dogId: item.dogId,
    eligible: false,
    problems: item.problems.length > 0 ? item.problems : [notForSaleProblem()],
  });
}

/**
 * What a dog says in its bag's bubble: what it's about to start, or, when nothing in the bag can be paid, why not.
 * A bag with one payable item names the course; with several it counts them.
 */
export function getGroupLine(group: DogGroup): string {
  const [only] = group.payable;
  if (group.payable.length === 1 && only) return m.account_cart_group_line_one({ course: only.course.title });
  if (group.payable.length > 1) return m.account_cart_group_line_many({ count: formatNumber(group.payable.length) });

  const [first] = group.items;
  return first ? getUnavailableVerdict(first).line : "";
}
