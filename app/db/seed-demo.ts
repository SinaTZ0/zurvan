import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "~/db/client.server";
import type { Transaction } from "~/db/client.server";
import {
  commission,
  course,
  dog,
  dogPassedCourse,
  enrollment,
  evaluation,
  evaluationPhoto,
  evaluationVideo,
  partner,
  partnerLead,
  payment,
  paymentItem,
  user,
} from "~/db/schema";
import { env } from "~/env.server";
import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { getPaymentGateway } from "~/lib/payment-gateway.server";
import { phonePlaceholderEmail } from "~/lib/phone";
import { deleteObjects, videoKey } from "~/lib/storage.server";
import { completeGatewayPayment, payCart } from "~/orpc/checkout/service";
import { finishEnrollment } from "~/orpc/enrollment/service";
import { markDogEvaluated, requestEvaluation } from "~/orpc/evaluation/service";
import { parseVideoFormat } from "~/orpc/evaluation/video";
import { attachMedia, deleteMedia, uploadMedia } from "~/orpc/media/service";

/*===== Demo Seed =====*/
// `npm run db:seed:demo`: the catalogue (`seed.ts`) plus one account per role for the owner's showcase, each signing
// in with the showcase code, dogs (with photos) for the customers, and the evaluation-and-purchase story told through
// the real services: Leo is evaluated and has bought, finished and started courses (one of them in a race that leaves a
// paid, not enrolled item), Pesteh has an evaluation request waiting with a photo, and Rocky has none. Sara came in
// through the partner's link, so her first purchase wrote a commission. Idempotent: accounts are upserted by phone
// number, and the demo customers' dogs, evaluations and purchases are replaced, along with their photos in the bucket,
// so running it again resets the demo without duplicating anything.
//
// Showcase only: these accounts have well-known numbers and a public code, so the script refuses to run otherwise.

/** `YYYY-MM-DD` for a date `months` months before today, so the demo dogs keep their ages whenever it is seeded. */
function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

/**
 * The demo customers' dogs. The second customer has none, to show the empty state. Leo is known to the Admin (he trained
 * him before the site existed); Pesteh is new and has asked for her free evaluation; Rocky is a puppy who hasn't yet.
 */
const DEMO_DOGS = [
  {
    ownerPhone: "09120000004",
    photoFile: "dog-leo.jpg",
    name: "لئو",
    breed: "ژرمن شپرد",
    sex: "male",
    birthDate: monthsAgo(36),
    birthDateApproximate: true,
    weightKg: 32.5,
    isNeutered: true,
    microchipNumber: "982000412345678",
    vaccinationStatus: "up_to_date",
    behaviorNotes: "از صدای موتور و اسکیت می‌ترسد و پارس می‌کند.",
    medicalNotes: null,
  },
  {
    ownerPhone: "09120000004",
    photoFile: "dog-pesteh.jpg",
    name: "پسته",
    breed: "پامرانین",
    sex: "female",
    birthDate: monthsAgo(10),
    birthDateApproximate: false,
    weightKg: 2.8,
    isNeutered: false,
    microchipNumber: null,
    vaccinationStatus: "partial",
    behaviorNotes: "وقتی تنها می‌ماند زوزه می‌کشد.",
    medicalNotes: "به مرغ حساسیت دارد.",
  },
  {
    ownerPhone: "09120000006",
    // No photo: shows a dog without one, and nothing suitable is in the repo.
    photoFile: null,
    name: "راکی",
    breed: "مخلوط",
    sex: "male",
    birthDate: monthsAgo(5),
    birthDateApproximate: true,
    weightKg: 14,
    isNeutered: false,
    microchipNumber: null,
    vaccinationStatus: "partial",
    behaviorNotes: "روی قلاده می‌کشد و به مهمان‌ها می‌پرد.",
    medicalNotes: null,
  },
];

/** Photos go through the real pipeline (`uploadMedia`), exactly as a customer's upload would. */
async function uploadDogPhoto({ ownerId, photoFile }: { ownerId: string; photoFile: string }): Promise<string> {
  const bytes = await readFile(path.resolve(import.meta.dirname, "seed-images", photoFile));
  const file = new File([new Uint8Array(bytes)], photoFile, { type: "image/jpeg" });

  const uploaded = await uploadMedia({ db, user: { id: ownerId, role: "customer" }, kind: "dog", file });
  if (uploaded.kind !== "success") throw new Error(`Could not upload ${photoFile}: ${JSON.stringify(uploaded)}`);

  const attached = await attachMedia({ db, mediaId: uploaded.media.id, kind: "dog", userId: ownerId });
  if (attached.kind !== "ok") throw new Error(`Could not attach ${photoFile}.`);

  return uploaded.media.id;
}

/*===== Reset =====*/
const PARTNER_PHONE = "09120000003";
const PARTNER_CODE = "bahram-petshop";
// A made-up Sheba with correct check digits, so Bahram's pay block has something to copy.
const PARTNER_SHEBA = "IR050170000000123456789012";
// The second partner has no Sheba yet, so the Admin sees both kinds of pay block.
const SECOND_PARTNER_PHONE = "09120000007";
const SECOND_PARTNER_CODE = "niloofar-clinic";

/**
 * Removes the demo customers' commissions, enrollments, payments, evaluations and passed courses, in the order their
 * references allow, so their dogs can go next.
 *
 * @returns The evaluation photos and the bucket keys of the evaluation videos, to delete once this commits.
 */
async function removeDemoHistory({ tx, customerIds }: { tx: Transaction; customerIds: string[] }) {
  await tx.delete(commission).where(inArray(commission.customerId, customerIds));
  await tx.delete(enrollment).where(inArray(enrollment.customerId, customerIds));
  await tx
    .delete(paymentItem)
    .where(
      inArray(
        paymentItem.paymentId,
        tx.select({ id: payment.id }).from(payment).where(inArray(payment.customerId, customerIds)),
      ),
    );
  await tx.delete(payment).where(inArray(payment.customerId, customerIds));

  const evaluationIds = tx
    .select({ id: evaluation.id })
    .from(evaluation)
    .where(inArray(evaluation.customerId, customerIds));
  const photos = await tx
    .select({ mediaId: evaluationPhoto.mediaId })
    .from(evaluationPhoto)
    .where(inArray(evaluationPhoto.evaluationId, evaluationIds));
  const videos = await tx
    .select({ id: evaluationVideo.id, format: evaluationVideo.format })
    .from(evaluationVideo)
    .where(inArray(evaluationVideo.evaluationId, evaluationIds));
  await tx.delete(evaluationPhoto).where(inArray(evaluationPhoto.evaluationId, evaluationIds));
  await tx.delete(evaluationVideo).where(inArray(evaluationVideo.evaluationId, evaluationIds));
  await tx.delete(evaluation).where(inArray(evaluation.customerId, customerIds));

  await tx
    .delete(dogPassedCourse)
    .where(
      inArray(dogPassedCourse.dogId, tx.select({ id: dog.id }).from(dog).where(inArray(dog.ownerId, customerIds))),
    );

  return {
    photoIds: photos.map((photo) => photo.mediaId),
    videoKeys: videos.map((video) => videoKey({ videoId: video.id, format: parseVideoFormat(video.format) })),
  };
}

/*===== Story =====*/
const CALLBACK_URL = "http://localhost/payment/callback";
const DAY_MS = 24 * 3_600_000;

/** Sara pays for `slugs` for Leo through the real checkout, and the demo gateway calls back at once. */
async function purchase({
  customerId,
  dogId,
  slugs,
  callBack = true,
}: {
  customerId: string;
  dogId: string;
  slugs: string[];
  callBack?: boolean;
}) {
  const gateway = getPaymentGateway();
  const started = await payCart({
    db,
    gateway,
    customerId,
    input: { items: slugs.map((courseSlug) => ({ courseSlug, dogId })) },
    callbackUrl: CALLBACK_URL,
  });
  if (started.kind !== "redirect")
    throw new Error(`purchase: ${slugs.join(", ")} could not be started: ${JSON.stringify(started)}`);

  const params = new URL(started.url, "http://localhost").searchParams;
  const settle = () =>
    completeGatewayPayment({ db, gateway, authority: params.get("Authority") ?? "", callbackParams: params });
  if (callBack) await settle();
  return settle;
}

/** The Admin presses «تمام شد» on the customer's active enrollment of a course. */
async function completeCourse({ dogId, slug }: { dogId: string; slug: string }) {
  const [row] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(sql`${enrollment.dogId} = ${dogId} and ${course.slug} = ${slug} and ${enrollment.status} = 'active'`);
  if (!row) throw new Error(`completeCourse: no active enrollment of ${slug}.`);
  const result = await finishEnrollment({ db, id: row.id, status: "completed" });
  if (result.kind !== "success") throw new Error(`completeCourse: ${slug} could not be completed.`);
}

/**
 * Tells the demo's story with the app's own services, so every row is what the app would have made: Leo evaluated by
 * the Admin directly, bought and finished the first companion course, started the second, and lost a race for
 * Elementary (two payments for the same course, one enrollment, one item paid but not enrolled); Pesteh requested her
 * evaluation with a photo.
 */
async function seedStory({ accountIds, dogIds }: { accountIds: Map<string, string>; dogIds: Map<string, string> }) {
  const sara = accountIds.get("09120000004");
  const leoId = dogIds.get("لئو");
  const pestehId = dogIds.get("پسته");
  if (!sara || !leoId || !pestehId) throw new Error("seedStory: a demo account or dog is missing.");

  /*------ Leo ------*/
  const evaluated = await markDogEvaluated({ db, dogId: leoId });
  if (evaluated.kind !== "success") throw new Error("seedStory: Leo could not be evaluated.");

  // The first purchase, which writes Sara's partner's commission, and the end of its training.
  await purchase({ customerId: sara, dogId: leoId, slugs: ["companion-1", "cgc"] });
  await completeCourse({ dogId: leoId, slug: "companion-1" });
  await purchase({ customerId: sara, dogId: leoId, slugs: ["companion-2"] });

  // Two payments for the same course started before either came back: the loser is paid, not enrolled.
  const first = await purchase({ customerId: sara, dogId: leoId, slugs: ["elementary"], callBack: false });
  const second = await purchase({ customerId: sara, dogId: leoId, slugs: ["elementary"], callBack: false });
  await first();
  await second();

  /*------ Pesteh ------*/
  const file = new File(
    [new Uint8Array(await readFile(path.resolve(import.meta.dirname, "seed-images", "dog-pesteh.jpg")))],
    "dog-pesteh.jpg",
    {
      type: "image/jpeg",
    },
  );
  const uploaded = await uploadMedia({ db, user: { id: sara, role: "customer" }, kind: "evaluation", file });
  if (uploaded.kind !== "success") throw new Error("seedStory: Pesteh's photo could not be uploaded.");
  const tomorrow = new Date(Date.now() + DAY_MS).toISOString().slice(0, 10);
  const requested = await requestEvaluation({
    db,
    customerId: sara,
    input: {
      dogId: pestehId,
      earliestDate: tomorrow,
      availableDays: ["saturday", "monday", "wednesday"],
      availablePeriods: ["evening"],
      photoMediaIds: [uploaded.media.id],
      videoIds: [],
    },
  });
  if (requested.kind !== "success") throw new Error(`seedStory: Pesteh's request failed: ${JSON.stringify(requested)}`);
}

async function seedDemo() {
  if (!env.SHOWCASE_MODE) {
    throw new Error("Demo accounts are for showcase mode only. Set SHOWCASE_MODE=true to seed them.");
  }

  // Photos are uploaded and removed outside the transaction: they need the accounts committed (the media rows point at
  // their uploader), and the bucket can't be rolled back anyway.
  const {
    oldPhotoIds,
    oldVideoKeys,
    seededDogs,
    idByPhone: accountIds,
  } = await db.transaction(async (tx) => {
    /*------ Accounts ------*/
    const accounts = await tx
      .insert(user)
      .values(
        DEMO_ACCOUNTS.map((account) => ({
          id: randomUUID(),
          name: `${account.firstName} ${account.lastName}`,
          email: phonePlaceholderEmail(account.phoneNumber),
          phoneNumber: account.phoneNumber,
          phoneNumberVerified: true,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          status: "active",
        })),
      )
      .onConflictDoUpdate({
        target: user.phoneNumber,
        set: {
          name: sql`excluded.name`,
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          role: sql`excluded.role`,
          status: sql`excluded.status`,
          phoneNumberVerified: sql`true`,
        },
      })
      .returning({ id: user.id, phoneNumber: user.phoneNumber });

    const idByPhone = new Map(accounts.map((account) => [account.phoneNumber ?? "", account.id]));
    const customerIds = DEMO_ACCOUNTS.filter((demo) => demo.role === "customer").flatMap((demo) => {
      const id = idByPhone.get(demo.phoneNumber);
      return id ? [id] : [];
    });

    /*------ Partner ------*/
    const partnerId = idByPhone.get(PARTNER_PHONE);
    if (!partnerId) throw new Error("seedDemo: the demo partner account is missing.");
    await tx
      .insert(partner)
      .values({ userId: partnerId, code: PARTNER_CODE, shebaNumber: PARTNER_SHEBA, isActive: true })
      .onConflictDoUpdate({
        target: partner.userId,
        set: { code: PARTNER_CODE, shebaNumber: PARTNER_SHEBA, isActive: true },
      });

    const secondPartnerId = idByPhone.get(SECOND_PARTNER_PHONE);
    if (!secondPartnerId) throw new Error("seedDemo: the second demo partner account is missing.");
    await tx
      .insert(partner)
      .values({ userId: secondPartnerId, code: SECOND_PARTNER_CODE, shebaNumber: null, isActive: true })
      .onConflictDoUpdate({
        target: partner.userId,
        set: { code: SECOND_PARTNER_CODE, shebaNumber: null, isActive: true },
      });

    // Phone leads: two of Bahram's are waiting; the second partner entered one of those numbers later (so it is lost
    // to her) and one of her own. Replaced on every run, like the rest of the demo.
    await tx.delete(partnerLead).where(inArray(partnerLead.partnerId, [partnerId, secondPartnerId]));
    const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    await tx.insert(partnerLead).values([
      { partnerId, phoneNumber: "09125550101", createdAt: daysAgo(6) },
      { partnerId, phoneNumber: "09125550102", createdAt: daysAgo(4) },
      { partnerId: secondPartnerId, phoneNumber: "09125550102", createdAt: daysAgo(2) },
      { partnerId: secondPartnerId, phoneNumber: "09125550103", createdAt: daysAgo(1) },
    ]);

    // Sara came in through the partner's link; the others were not brought in by anyone.
    await tx.update(user).set({ referredByPartnerId: null }).where(inArray(user.id, customerIds));
    const sara = idByPhone.get("09120000004");
    if (sara) await tx.update(user).set({ referredByPartnerId: partnerId }).where(eq(user.id, sara));

    /*------ Reset ------*/
    const history = await removeDemoHistory({ tx, customerIds });

    /*------ Dogs ------*/
    // The old photos are collected before their dogs go, and deleted from the bucket once this commits.
    const oldPhotos = await tx
      .select({ mediaId: dog.photoMediaId })
      .from(dog)
      .where(inArray(dog.ownerId, customerIds))
      .then((rows) => rows.flatMap((row) => (row.mediaId ? [row.mediaId] : [])));
    await tx.delete(dog).where(inArray(dog.ownerId, customerIds));

    // One insert shares one `now()`, so space the creation times out to keep each list in the order above.
    const start = Date.now() - DEMO_DOGS.length * 60_000;
    const inserted = await tx
      .insert(dog)
      .values(
        DEMO_DOGS.map(({ photoFile: _photoFile, ownerPhone, ...demoDog }, index) => {
          const ownerId = idByPhone.get(ownerPhone);
          if (!ownerId) throw new Error(`No demo account for ${ownerPhone}.`);
          return { ...demoDog, ownerId, createdAt: new Date(start + index * 60_000) };
        }),
      )
      .returning({ id: dog.id, name: dog.name, ownerId: dog.ownerId })
      .then((rows) =>
        rows.flatMap((row) => {
          const demoDog = DEMO_DOGS.find((candidate) => candidate.name === row.name);
          return demoDog ? [{ id: row.id, ownerId: row.ownerId, name: row.name, photoFile: demoDog.photoFile }] : [];
        }),
      );

    console.log(`Seeded ${accounts.length} demo accounts and ${inserted.length} dogs.`);
    for (const account of DEMO_ACCOUNTS) console.log(`  ${account.phoneNumber}  ${account.role}`);

    return {
      oldPhotoIds: [...oldPhotos, ...history.photoIds],
      oldVideoKeys: history.videoKeys,
      seededDogs: inserted,
      idByPhone,
    };
  });

  /*------ Photos ------*/
  for (const mediaId of oldPhotoIds) await deleteMedia({ db, mediaId });
  if (oldVideoKeys.length > 0) await deleteObjects({ keys: oldVideoKeys });

  let uploaded = 0;
  for (const seededDog of seededDogs) {
    if (!seededDog.photoFile) continue;

    const mediaId = await uploadDogPhoto({ ownerId: seededDog.ownerId, photoFile: seededDog.photoFile });
    await db.update(dog).set({ photoMediaId: mediaId }).where(eq(dog.id, seededDog.id));
    uploaded++;
  }
  console.log(`Uploaded ${uploaded} dog photos.`);

  /*------ Story ------*/
  // After the transaction: it goes through the app's own services, which run their own database transactions.
  await seedStory({ accountIds, dogIds: new Map(seededDogs.map((seeded) => [seeded.name, seeded.id])) });
  console.log("Seeded the evaluations, purchases, enrollments and the partner's commission.");
}

await seedDemo();
await db.$client.end();
