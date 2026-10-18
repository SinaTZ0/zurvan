import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { consent, course, dog, evaluation, payment, paymentItem, user } from "~/db/schema";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import {
  acceptSiteRules,
  findDogConsent,
  getConsentStatus,
  giveDogConsent,
  hasAcceptedSiteRules,
  withdrawDogConsent,
} from "~/orpc/consent/service";
import { payCart } from "~/orpc/checkout/service";
import { createDog } from "~/orpc/dog/service";
import { markDogEvaluated } from "~/orpc/evaluation/service";

/*===== Consent =====*/
// Runs against the real database, where the consequences are: what was accepted is recorded with its version and time, a
// new version asks again, accepting twice records once, a withdrawn consent stays on record, and with rules published no
// money is taken from someone who hasn't accepted them. Needs the schema (`npm run db:push`).

const runId = randomUUID().slice(0, 8);
const phoneBase = `096${Math.floor(10000 + Math.random() * 89999)}`;
const ana = { id: `test-consent-ana-${runId}`, phone: `${phoneBase}001` };
const ben = { id: `test-consent-ben-${runId}`, phone: `${phoneBase}002` };

const V1 = { version: `v1-${runId}` };
const V2 = { version: `v2-${runId}` };
const courseSlug = `test-consent-${runId}`;
let courseId = "";
let anasDog = "";

async function rowsOf(userId: string) {
  return db.select().from(consent).where(eq(consent.userId, userId));
}

beforeAll(async () => {
  await db.insert(user).values(
    [ana, ben].map((person) => ({
      id: person.id,
      name: "Test customer",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
      role: "customer",
    })),
  );
  const [row] = await db
    .insert(course)
    .values({
      slug: courseSlug,
      title: "آزمایش قوانین",
      latinName: courseSlug,
      family: "basics",
      status: "approved",
      summary: "آزمایشی",
      coverImage: "/x.webp",
      coverAlt: "x",
      coverWidth: 1,
      coverHeight: 1,
      price: 3_000_000,
      position: 9999,
    })
    .returning({ id: course.id });
  courseId = row?.id ?? "";
  const created = await createDog({
    db,
    ownerId: ana.id,
    input: { name: "رکس", sex: "male", birthDate: "2024-05-01", weightKg: 20, isNeutered: true },
  });
  if (created.kind !== "success") throw new Error("Could not create the test dog.");
  anasDog = created.dog.id;
  await markDogEvaluated({ db, dogId: anasDog });
});

afterAll(async () => {
  const ids = [ana.id, ben.id];
  const paymentIds = db.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, ids));
  await db.delete(consent).where(inArray(consent.userId, ids));
  await db.delete(paymentItem).where(inArray(paymentItem.paymentId, paymentIds));
  await db.delete(payment).where(inArray(payment.customerId, ids));
  await db.delete(evaluation).where(inArray(evaluation.customerId, ids));
  await db.delete(dog).where(inArray(dog.ownerId, ids));
  await db.delete(course).where(eq(course.id, courseId));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

describe("the site rules", () => {
  it("with none published there is nothing to accept, and nothing is recorded", async () => {
    expect(await getConsentStatus({ db, userId: ana.id, rules: null })).toEqual({ siteRules: null });
    expect(await hasAcceptedSiteRules({ db, userId: ana.id, rules: null })).toBe(true);
    expect(await acceptSiteRules({ db, userId: ana.id, rules: null })).toEqual({ kind: "not-published" });
    expect(await rowsOf(ana.id)).toEqual([]);
  });

  it("records the version and the time, once however often it is accepted, for that person only", async () => {
    const before = Date.now();
    expect(await getConsentStatus({ db, userId: ana.id, rules: V1 })).toEqual({
      siteRules: { version: V1.version, accepted: false },
    });

    expect(await acceptSiteRules({ db, userId: ana.id, rules: V1 })).toEqual({ kind: "success", version: V1.version });
    expect(await acceptSiteRules({ db, userId: ana.id, rules: V1 })).toEqual({ kind: "success", version: V1.version });

    const rows = await rowsOf(ana.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "site-rules", version: V1.version, dogId: null, revokedAt: null });
    expect(rows[0]?.acceptedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(await hasAcceptedSiteRules({ db, userId: ana.id, rules: V1 })).toBe(true);

    // Ben accepted nothing, whatever Ana did.
    expect(await hasAcceptedSiteRules({ db, userId: ben.id, rules: V1 })).toBe(false);
    expect(await rowsOf(ben.id)).toEqual([]);
  });

  it("asks again when the wording changes, and keeps the record of the old acceptance", async () => {
    expect(await hasAcceptedSiteRules({ db, userId: ana.id, rules: V2 })).toBe(false);
    await acceptSiteRules({ db, userId: ana.id, rules: V2 });

    expect(await hasAcceptedSiteRules({ db, userId: ana.id, rules: V2 })).toBe(true);
    const versions = (await rowsOf(ana.id)).map((row) => row.version);
    expect(versions).toHaveLength(2);
    expect(versions).toContain(V1.version);
    expect(versions).toContain(V2.version);
  });
});

describe("paying with rules published", () => {
  it("takes no money from someone who hasn't accepted them, and starts once they have", async () => {
    const gateway = getPaymentGateway();
    const pay = (rules: typeof V1) =>
      payCart({
        db,
        gateway,
        customerId: ana.id,
        input: { items: [{ courseSlug, dogId: anasDog }] },
        callbackUrl: "http://localhost/payment/callback",
        rules,
      });
    const payments = () => db.select().from(payment).where(eq(payment.customerId, ana.id));

    // Ana accepted v1 and v2 above; a v3 she has not seen is the gate.
    const V3 = { version: `v3-${runId}` };
    expect(await pay(V3)).toEqual({ kind: "rules-not-accepted" });
    expect(await payments()).toEqual([]);

    await acceptSiteRules({ db, userId: ana.id, rules: V3 });
    const started = await pay(V3);
    expect(started.kind).toBe("redirect");
    expect(await payments()).toHaveLength(1);
  });

  it("is not in the way while no rules are published", async () => {
    const started = await payCart({
      db,
      gateway: getPaymentGateway(),
      customerId: ben.id,
      input: { items: [{ courseSlug, dogId: anasDog }] },
      callbackUrl: "http://localhost/payment/callback",
      rules: null,
    });
    // Ben has no such dog, so it is refused for that reason, not for rules.
    expect(started.kind).toBe("not-eligible");
  });
});

describe("a consent given for one dog", () => {
  it("is recorded with its version, can be withdrawn, and stays on record when it is", async () => {
    expect(await findDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook" })).toBeNull();

    await giveDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook", version: "p1" });
    await giveDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook", version: "p1" });
    expect(await findDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook" })).toMatchObject({
      version: "p1",
    });

    expect(await withdrawDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook" })).toBe(true);
    expect(await withdrawDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook" })).toBe(false);
    expect(await findDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook" })).toBeNull();

    // Giving it again is a new record; the withdrawn one is still there with its time.
    await giveDogConsent({ db, userId: ana.id, dogId: anasDog, kind: "public-logbook", version: "p1" });
    const dogRows = (await rowsOf(ana.id)).filter((row) => row.dogId === anasDog);
    expect(dogRows).toHaveLength(2);
    expect(dogRows.filter((row) => row.revokedAt !== null)).toHaveLength(1);
  });

  it("never reads as someone else's", async () => {
    expect(await findDogConsent({ db, userId: ben.id, dogId: anasDog, kind: "public-logbook" })).toBeNull();
  });
});
