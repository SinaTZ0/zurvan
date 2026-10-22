import type { DatabaseOrTransaction } from "~/db/client.server";
import type { Cart } from "~/orpc/cart/contract";
import {
  countCartRows,
  deleteAllCartRows,
  deleteCartRow,
  deleteCartRowsOfPayment,
  findCartPairKeys,
  findCartRows,
  insertCartRows,
} from "~/orpc/cart/repository";
import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import type { CartItem } from "~/orpc/checkout/contract";
import { findCoursesBySlugs } from "~/orpc/course/repository";
import { findDogsByOwner } from "~/orpc/dog/repository";
import { isDogId } from "~/orpc/dog/validation";
import { m } from "~/paraglide/messages";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

type InvalidResult = { kind: "invalid"; errors: string[] };

/** An item that points at a real course and one of the customer's own dogs. */
type ResolvedItem = { courseId: string; dogId: string };

/*===== Resolving =====*/
/**
 * Keeps the items that belong: the course exists and the dog is the customer's. Another customer's dog reads as not
 * there, so a hand-made request can't put it in a cart or find out it exists. Repeats are dropped.
 *
 * With `approvedOnly`, a draft or archived course reads as not there too: adding one would persist it and let
 * `checkout.review` show its title and price. Removal leaves it off, so a course archived while in a cart can still go.
 */
async function resolveItems({
  db,
  userId,
  items,
  approvedOnly = false,
}: Executor & { userId: string; items: readonly CartItem[]; approvedOnly?: boolean }): Promise<ResolvedItem[]> {
  const wellFormed = items.filter((item) => item.courseSlug.trim() !== "" && isDogId(item.dogId));
  if (wellFormed.length === 0) return [];

  const [courses, dogs] = await Promise.all([
    findCoursesBySlugs({ db, slugs: [...new Set(wellFormed.map((item) => item.courseSlug))] }),
    findDogsByOwner({ db, ownerId: userId }),
  ]);

  const resolved = new Map<string, ResolvedItem>();
  for (const item of wellFormed) {
    const course = courses.find(
      (candidate) => candidate.slug === item.courseSlug && (!approvedOnly || candidate.status === "approved"),
    );
    const dog = dogs.find((candidate) => candidate.id === item.dogId);
    if (course && dog) resolved.set(`${dog.id}:${course.id}`, { courseId: course.id, dogId: dog.id });
  }
  return [...resolved.values()];
}

/*===== Reads =====*/
export async function getCart({ db, userId }: Executor & { userId: string }): Promise<Cart> {
  return { items: await findCartRows({ db, userId }) };
}

/*===== Changes =====*/
/**
 * Adds one item. Adding what is already there succeeds and changes nothing; a full cart refuses anything new (the limit
 * is a ceiling against a hand-made request, not a business rule).
 */
export async function addToCart({
  db,
  userId,
  item,
}: Executor & { userId: string; item: CartItem }): Promise<{ kind: "success"; cart: Cart } | InvalidResult> {
  const [resolved] = await resolveItems({ db, userId, items: [item], approvedOnly: true });
  if (!resolved) return { kind: "invalid", errors: [m.server_cart_item_gone()] };

  const already = await findCartPairKeys({ db, userId, courseIds: [resolved.courseId] });
  if (!already.has(`${resolved.dogId}:${resolved.courseId}`)) {
    if ((await countCartRows({ db, userId })) >= CART_MAX_ITEMS) {
      return { kind: "invalid", errors: [m.server_cart_max_items({ max: String(CART_MAX_ITEMS) })] };
    }
    await insertCartRows({ db, userId, pairs: [resolved] });
  }
  return { kind: "success", cart: await getCart({ db, userId }) };
}

/** Takes one item out. Something that isn't there, or never could be, is not an error: the cart is as asked. */
export async function removeFromCart({
  db,
  userId,
  item,
}: Executor & { userId: string; item: CartItem }): Promise<Cart> {
  // Resolved against the customer's own dogs too, though removing needs only the ids: a deletion is always scoped to
  // the user, so another customer's dog can't be touched either way.
  const [resolved] = await resolveItems({ db, userId, items: [item] });
  if (resolved) await deleteCartRow({ db, userId, dogId: resolved.dogId, courseId: resolved.courseId });
  return getCart({ db, userId });
}

export async function clearCart({ db, userId }: Executor & { userId: string }): Promise<Cart> {
  await deleteAllCartRows({ db, userId });
  return { items: [] };
}

/**
 * Adds a list at once, for the cart a browser already holds when its customer signs in. What doesn't belong, and what
 * doesn't fit under `CART_MAX_ITEMS`, is left out instead of failing the whole list.
 */
export async function mergeIntoCart({
  db,
  userId,
  items,
}: Executor & { userId: string; items: readonly CartItem[] }): Promise<Cart> {
  const resolved = await resolveItems({ db, userId, items, approvedOnly: true });
  if (resolved.length > 0) {
    const already = await findCartPairKeys({ db, userId, courseIds: [...new Set(resolved.map((r) => r.courseId))] });
    const fresh = resolved.filter((pair) => !already.has(`${pair.dogId}:${pair.courseId}`));
    const room = Math.max(0, CART_MAX_ITEMS - (await countCartRows({ db, userId })));
    await insertCartRows({ db, userId, pairs: fresh.slice(0, room) });
  }
  return getCart({ db, userId });
}

/** After a payment settles: takes the items it bought out of the customer's cart, on whichever device they were added. */
export async function removePaidItemsFromCart({
  db,
  userId,
  paymentId,
}: Executor & { userId: string; paymentId: string }): Promise<void> {
  await deleteCartRowsOfPayment({ db, userId, paymentId });
}
