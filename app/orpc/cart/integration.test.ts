import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { cartItem, course, dog, enrollment, evaluation, payment, paymentItem, user } from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { addToCart, clearCart, getCart, mergeIntoCart, removeFromCart } from "~/orpc/cart/service";
import { CART_MAX_ITEMS } from "~/orpc/checkout/constants";
import { completeGatewayPayment, payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== Cart =====*/
// Runs against the real database, where the consequences are: a cart is one customer's and nobody else's, a dog that
// isn't theirs never gets in, adding is idempotent, the limit holds, and paying takes the bought items out of the cart on
// every device. Needs the schema (`npm run db:push`). The test makes its own courses and people.

const runId = randomUUID().slice(0, 8);
const phoneBase = `097${Math.floor(10000 + Math.random() * 89999)}`;
const PRICE = 5_000_000;

const ana = { id: `test-cart-ana-${runId}`, phone: `${phoneBase}001` };
const ben = { id: `test-cart-ben-${runId}`, phone: `${phoneBase}002` };
const people = [ana, ben];

// Enough courses that two dogs can fill the cart to its limit and one more pair doesn't fit.
const courseSlugs = Array.from({ length: CART_MAX_ITEMS / 2 + 1 }, (_, index) => `test-cart-${index}-${runId}`);
const courseIds: string[] = [];
const dogs: { ana: string[]; ben: string } = { ana: [], ben: "" };

async function insertCourse(slug: string): Promise<string> {
  const [row] = await db
    .insert(course)
    .values({
      slug,
      title: `آزمایش ${slug}`,
      latinName: slug,
      family: "basics",
      status: "approved",
      summary: "آزمایشی",
      coverImage: "/x.webp",
      coverAlt: "x",
      coverWidth: 1,
      coverHeight: 1,
      price: PRICE,
      position: 9999,
    })
    .returning({ id: course.id });
  if (!row) throw new Error("Could not insert the test course.");
  return row.id;
}

async function makeDog(ownerId: string, name: string): Promise<string> {
  const created = await createDog({
    db,
    ownerId,
    input: { name, sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  return created.dog.id;
}

const slugAt = (index: number) => courseSlugs[index] ?? "";

beforeAll(async () => {
  await db.insert(user).values(
    people.map((person) => ({
      id: person.id,
      name: "Test customer",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: "customer",
    })),
  );
  for (const slug of courseSlugs) courseIds.push(await insertCourse(slug));
  dogs.ana = [await makeDog(ana.id, "رکس"), await makeDog(ana.id, "لونا")];
  dogs.ben = await makeDog(ben.id, "بنی");
});

afterAll(async () => {
  const customerIds = [ana.id, ben.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(enrollment).where(inArray(enrollment.customerId, customerIds));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(evaluation).where(inArray(evaluation.customerId, customerIds));
  // The dogs and courses go first: the cart rows go with them.
  await db.delete(dog).where(inArray(dog.ownerId, customerIds));
  await db.delete(course).where(inArray(course.id, courseIds));
  await db.delete(cartItem).where(inArray(cartItem.userId, customerIds));
  await db.delete(user).where(inArray(user.id, customerIds));
  await db.$client.end();
});

describe("adding and removing", () => {
  it("saves an item, lists it, and treats adding it again as the same", async () => {
    const item = { courseSlug: slugAt(0), dogId: dogs.ana[0] ?? "" };

    const first = await addToCart({ db, userId: ana.id, item });
    const second = await addToCart({ db, userId: ana.id, item });

    expect(first).toEqual({ kind: "success", cart: { items: [item] } });
    expect(second).toEqual({ kind: "success", cart: { items: [item] } });
    expect(await getCart({ db, userId: ana.id })).toEqual({ items: [item] });

    // Removing it, then removing what is no longer there, both leave the cart as asked.
    expect(await removeFromCart({ db, userId: ana.id, item })).toEqual({ items: [] });
    expect(await removeFromCart({ db, userId: ana.id, item })).toEqual({ items: [] });
  });

  it("refuses a dog that isn't theirs, a course that doesn't exist and a malformed dog id", async () => {
    const refused = async (item: { courseSlug: string; dogId: string }) => {
      const result = await addToCart({ db, userId: ana.id, item });
      return result.kind;
    };

    // Ben's dog is no cart item of Ana's, whoever asks, and Ana learns nothing about it.
    expect(await refused({ courseSlug: slugAt(0), dogId: dogs.ben })).toBe("invalid");
    expect(await refused({ courseSlug: "no-such-course", dogId: dogs.ana[0] ?? "" })).toBe("invalid");
    expect(await refused({ courseSlug: slugAt(0), dogId: "not-a-uuid" })).toBe("invalid");
    expect((await getCart({ db, userId: ana.id })).items).toEqual([]);
  });

  it("keeps each customer's cart to themselves, and one customer can't take items out of another's", async () => {
    const anas = { courseSlug: slugAt(1), dogId: dogs.ana[0] ?? "" };
    await addToCart({ db, userId: ana.id, item: anas });
    await addToCart({ db, userId: ben.id, item: { courseSlug: slugAt(1), dogId: dogs.ben } });

    expect(await getCart({ db, userId: ben.id })).toEqual({ items: [{ courseSlug: slugAt(1), dogId: dogs.ben }] });
    // Ben tries to remove Ana's item: it isn't his, so nothing happens to hers.
    await removeFromCart({ db, userId: ben.id, item: anas });
    expect((await getCart({ db, userId: ana.id })).items).toEqual([anas]);

    await clearCart({ db, userId: ana.id });
    await clearCart({ db, userId: ben.id });
    expect(await getCart({ db, userId: ana.id })).toEqual({ items: [] });
  });

  it("holds to the cart limit but still lets an item already there be added again", async () => {
    // Two dogs and ten courses fill the cart exactly.
    const full = courseSlugs
      .slice(0, CART_MAX_ITEMS / 2)
      .flatMap((courseSlug) => dogs.ana.map((dogId) => ({ courseSlug, dogId })));
    const merged = await mergeIntoCart({ db, userId: ana.id, items: full });
    expect(merged.items).toHaveLength(CART_MAX_ITEMS);

    const overflow = await addToCart({
      db,
      userId: ana.id,
      item: { courseSlug: slugAt(CART_MAX_ITEMS / 2), dogId: dogs.ana[0] ?? "" },
    });
    expect(overflow.kind).toBe("invalid");

    const again = await addToCart({ db, userId: ana.id, item: full[0] ?? { courseSlug: "", dogId: "" } });
    expect(again.kind).toBe("success");
    expect((await getCart({ db, userId: ana.id })).items).toHaveLength(CART_MAX_ITEMS);
    await clearCart({ db, userId: ana.id });
  });
});

describe("merging the cart a browser already holds", () => {
  it("keeps what belongs, drops the rest, and adds nothing twice", async () => {
    const mine = { courseSlug: slugAt(0), dogId: dogs.ana[0] ?? "" };
    const items = [
      mine,
      { ...mine },
      { courseSlug: slugAt(1), dogId: dogs.ben },
      { courseSlug: "no-such-course", dogId: dogs.ana[0] ?? "" },
      { courseSlug: slugAt(2), dogId: "not-a-uuid" },
    ];

    const once = await mergeIntoCart({ db, userId: ana.id, items });
    const twice = await mergeIntoCart({ db, userId: ana.id, items });

    expect(once).toEqual({ items: [mine] });
    expect(twice).toEqual({ items: [mine] });
    await clearCart({ db, userId: ana.id });
  });
});

describe("paying", () => {
  it("takes the items it bought out of the cart, and leaves the others", async () => {
    const customer = ana;
    const dogId = dogs.ana[1] ?? "";
    const evaluated = await markDogEvaluated({ db, dogId });
    expect(evaluated.kind).toBe("success");

    const bought = { courseSlug: slugAt(3), dogId };
    const kept = { courseSlug: slugAt(4), dogId };
    await addToCart({ db, userId: customer.id, item: bought });
    await addToCart({ db, userId: customer.id, item: kept });

    const gateway = getPaymentGateway();
    const started = await payCart({
      db,
      gateway,
      customerId: customer.id,
      input: { items: [bought] },
      callbackUrl: "http://localhost/payment/callback",
    });
    if (started.kind !== "redirect") throw new Error(`Could not start the payment: ${JSON.stringify(started)}`);
    const params = new URL(started.url, "http://localhost").searchParams;

    // Until the payment settles, nothing leaves the cart.
    expect((await getCart({ db, userId: customer.id })).items).toHaveLength(2);

    const result = await completeGatewayPayment({
      db,
      gateway,
      authority: params.get("Authority") ?? "",
      callbackParams: params,
    });
    expect(result).toMatchObject({ kind: "paid", enrolled: 1 });
    expect((await getCart({ db, userId: customer.id })).items).toEqual([kept]);

    const rows = await db.select().from(cartItem).where(eq(cartItem.userId, customer.id));
    expect(rows).toHaveLength(1);
    await clearCart({ db, userId: customer.id });
  });
});
