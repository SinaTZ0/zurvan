import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq, inArray, or, sql } from "drizzle-orm";

import { db } from "~/db/client.server";
import type { Transaction } from "~/db/client.server";
import { assessment, assessmentRecommendation, assessmentSlot, course, dog, user } from "~/db/schema";
import { env } from "~/env.server";
import { deleteDemoVideoObjects, detachDemoBehavior, removeDemoBehavior, seedBehavior } from "~/db/seed-behavior";
import { removeDemoTraining, seedTraining } from "~/db/seed-training";
import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { todayIso } from "~/lib/jalali";
import { phonePlaceholderEmail } from "~/lib/phone";
import { tehranToUtc, utcToTehranParts } from "~/lib/tehran-time";
import { attachMedia, deleteMedia, uploadMedia } from "~/orpc/media/service";

/*===== Demo Seed =====*/
// `npm run db:seed:demo`: the catalogue (`seed.ts`) plus one account per role for the owner's showcase, each signing
// in with the showcase code, and dogs (with photos) for the customers, plus the assessments: Arman's and Negar's open
// slots, and a booked, a completed and a due-today assessment; then Leo's training, bought through the real order flow
// (`seed-training.ts`), and the behavior requests (`seed-behavior.ts`). Idempotent: accounts are upserted by phone number, and the demo customers' dogs, orders and
// training, the demo trainers' slots and every assessment between them are replaced, along with the dogs' photos in
// the bucket, so running it again resets the demo without duplicating anything.
//
// Showcase only: these accounts have well-known numbers and a public code, so the script refuses to run otherwise.

/** `YYYY-MM-DD` for a date `months` months before today, so the demo dogs keep their ages whenever it is seeded. */
function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

/**
 * The demo customers' dogs. The second customer has none, to show the empty state. Leo has a record (Arman trained him
 * before the site existed, and has since assessed him); Pesteh is new, so she starts with a free assessment, which is
 * booked; Rocky is a puppy whose assessment is today, so BMC is pre-filled when it is recorded.
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
    knownSince: monthsAgo(14),
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
    knownSince: null,
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
    knownSince: null,
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

/*===== Assessments =====*/
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;

/** `date` (`YYYY-MM-DD`) plus whole days, as `YYYY-MM-DD`. */
function addDays({ date, days }: { date: string; days: number }): string {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

/** The instant the Tehran clock reads `time` on `date`. */
function atTehran(date: string, time: string): Date {
  return tehranToUtc({ date, time });
}

/** Friday is the weekend day the owner doesn't work, which is 6 when the week starts on Saturday. */
function isFriday(date: string): boolean {
  return utcToTehranParts(tehranToUtc({ date, time: "12:00" })).weekday === 6;
}

function isMonday(date: string): boolean {
  return utcToTehranParts(tehranToUtc({ date, time: "12:00" })).weekday === 2;
}

const LEO_NOTES =
  "لئو سگ باهوش و وفاداری است و با من خیلی زود جور شد. ترسش از موتور و اسکیت‌بورد جدی است: به‌جای فرار یا پارس، " +
  "باید یاد بگیرد صدا و حرکت را ببیند و آرام بماند. از CGC شروع کنید تا پایه‌ی حواس‌جمعی‌اش محکم شود، بعد " +
  "فرمان‌پذیری پیشرفته و در نهایت همراه‌سگ ۱. هر روز ده دقیقه تمرین «نگاه کن» در پیاده‌روی کافی است.";

type SeededDogs = Map<string, string>;

/**
 * Replaces the demo's assessments. Everything is placed relative to today in Tehran time, so the demo is always about
 * the coming days: Arman's open slots, Negar's two Mondays, one booked assessment, one completed and one that is due.
 * The caller has already removed the old ones.
 */
async function seedAssessments({
  tx,
  idByPhone,
  dogIds,
}: {
  tx: Transaction;
  idByPhone: Map<string, string>;
  dogIds: SeededDogs;
}) {
  const arman = idByPhone.get("09120000001");
  const negar = idByPhone.get("09120000002");
  const sara = idByPhone.get("09120000004");
  const maryam = idByPhone.get("09120000006");
  const leoId = dogIds.get("لئو");
  const pestehId = dogIds.get("پسته");
  const rockyId = dogIds.get("راکی");
  if (!arman || !negar || !sara || !maryam || !leoId || !pestehId || !rockyId) {
    throw new Error("seedAssessments: a demo account or dog is missing.");
  }

  const today = todayIso();

  /*------ Arman's open slots ------*/
  const armanDays = Array.from({ length: 14 }, (_, index) => addDays({ date: today, days: index + 1 })).filter(
    (date) => !isFriday(date),
  );
  // Pesteh's booked slot: two days from now, or the next working day after that.
  const bookedDay = armanDays.find((date) => date >= addDays({ date: today, days: 2 }));
  if (!bookedDay) throw new Error("seedAssessments: no working day for the booked assessment.");

  const openSlots = armanDays.flatMap((date, index) => {
    const times = ["10:00", "17:00"];
    // An evening slot on two of the days, to show that hours vary.
    if (index === 2 || index === 7) times.push("19:00");
    return times.filter((time) => !(date === bookedDay && time === "17:00")).map((time) => atTehran(date, time));
  });

  const negarMondays: string[] = [];
  for (let days = 1; negarMondays.length < 2; days++) {
    const date = addDays({ date: today, days });
    if (isMonday(date)) negarMondays.push(date);
  }

  await tx
    .insert(assessmentSlot)
    .values([
      ...openSlots.map((startsAt) => ({ trainerId: arman, startsAt })),
      ...negarMondays.map((date) => ({ trainerId: negar, startsAt: atTehran(date, "11:00") })),
    ]);

  /*------ Booked: Pesteh, in a few days ------*/
  const [pestehSlot] = await tx
    .insert(assessmentSlot)
    .values({ trainerId: arman, startsAt: atTehran(bookedDay, "17:00"), status: "booked" })
    .returning({ id: assessmentSlot.id });

  /*------ Completed: Leo, two months ago ------*/
  const leoStart = atTehran(addDays({ date: today, days: -60 }), "17:00");
  const [leoSlot] = await tx
    .insert(assessmentSlot)
    .values({ trainerId: arman, startsAt: leoStart, status: "booked" })
    .returning({ id: assessmentSlot.id });

  /*------ Due today: Rocky, started an hour ago ------*/
  // The Tehran hour before the current one, so it has started and the owner can record it from the trainer area.
  const { date: nowDate, time: nowTime } = utcToTehranParts(new Date());
  const rockyStart = new Date(atTehran(nowDate, `${nowTime.slice(0, 2)}:00`).getTime() - HOUR_MS);
  const [rockySlot] = await tx
    .insert(assessmentSlot)
    .values({ trainerId: arman, startsAt: rockyStart, status: "booked" })
    .returning({ id: assessmentSlot.id });

  if (!pestehSlot || !leoSlot || !rockySlot) throw new Error("seedAssessments: a slot was not inserted.");

  const [, , leoAssessment] = await tx
    .insert(assessment)
    .values([
      {
        slotId: pestehSlot.id,
        dogId: pestehId,
        customerId: sara,
        trainerId: arman,
        trainingGoal: "home",
        customerNote: "پسته وقتی تنها می‌ماند ساعت‌ها زوزه می‌کشد و همسایه‌ها شاکی شده‌اند. می‌خواهم آرام تنها بماند.",
        placeKind: "home",
        place: "تهران، ونک، خیابان ملاصدرا، کوچه‌ی چهارم، پلاک ۱۲، واحد ۴",
        status: "booked",
      },
      {
        slotId: rockySlot.id,
        dogId: rockyId,
        customerId: maryam,
        trainerId: arman,
        trainingGoal: "home",
        customerNote: "راکی روی قلاده می‌کشد و به مهمان‌ها می‌پرد. می‌خواهم در خانه و بیرون مؤدب باشد.",
        placeKind: "home",
        place: "تهران، سعادت‌آباد، خیابان سرو غربی، پلاک ۷، طبقه‌ی دوم",
        status: "booked",
      },
      {
        slotId: leoSlot.id,
        dogId: leoId,
        customerId: sara,
        trainerId: arman,
        trainingGoal: "home",
        customerNote: "لئو از موتور و اسکیت می‌ترسد و پارس می‌کند. می‌خواهم در پیاده‌روی آرام باشد.",
        placeKind: "meeting-point",
        place: "پارک ملت، کنار دریاچه",
        status: "completed",
        trainerNotes: LEO_NOTES,
        completedAt: new Date(leoStart.getTime() + 90 * 60_000),
        createdAt: new Date(leoStart.getTime() - 5 * DAY_MS),
      },
    ])
    .returning({ id: assessment.id });
  if (!leoAssessment) throw new Error("seedAssessments: the completed assessment was not inserted.");

  /*------ Leo's recommendations ------*/
  const recommended = ["cgc", "advanced", "companion-1"];
  const courses = await tx
    .select({ id: course.id, slug: course.slug })
    .from(course)
    .where(inArray(course.slug, recommended));
  await tx.insert(assessmentRecommendation).values(
    recommended.map((slug, position) => {
      const found = courses.find((candidate) => candidate.slug === slug);
      if (!found) throw new Error(`seedAssessments: course ${slug} is missing. Run \`npm run db:seed\` first.`);
      return { assessmentId: leoAssessment.id, courseId: found.id, position };
    }),
  );

  return { slots: openSlots.length + negarMondays.length + 3 };
}

async function seedDemo() {
  if (!env.SHOWCASE_MODE) {
    throw new Error("Demo accounts are for showcase mode only. Set SHOWCASE_MODE=true to seed them.");
  }

  // Photos are uploaded and removed outside the transaction: they need the accounts committed (the media rows point at
  // their uploader), and the bucket can't be rolled back anyway.
  const { oldPhotoIds, oldVideoKeys, seededDogs, idByPhone } = await db.transaction(async (tx) => {
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

    /*------ Reset ------*/
    const idByPhone = new Map(accounts.map((account) => [account.phoneNumber ?? "", account.id]));
    const customerIds = DEMO_ACCOUNTS.filter((demo) => demo.role === "customer").flatMap((demo) => {
      const id = idByPhone.get(demo.phoneNumber);
      return id ? [id] : [];
    });
    const trainerIds = DEMO_ACCOUNTS.filter((demo) => demo.role === "admin" || demo.role === "trainer").flatMap(
      (demo) => {
        const id = idByPhone.get(demo.phoneNumber);
        return id ? [id] : [];
      },
    );

    // Training and its money point at the dogs and at the assessments that recommended it, so they go first.
    // Behavior requests are tied to their order items both ways, so they let go first and are deleted after.
    await detachDemoBehavior({ tx, customerIds });
    await removeDemoTraining({ tx, customerIds });
    const removedVideoKeys = await removeDemoBehavior({ tx, customerIds });

    // Assessments point at slots and dogs, so they go first (their recommendations go with them), then the slots, then
    // the dogs. Anyone else's assessment with a demo trainer or customer goes too: it would block the delete.
    await tx
      .delete(assessment)
      .where(or(inArray(assessment.customerId, customerIds), inArray(assessment.trainerId, trainerIds)));
    await tx.delete(assessmentSlot).where(inArray(assessmentSlot.trainerId, trainerIds));

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

    /*------ Assessments ------*/
    const { slots } = await seedAssessments({
      tx,
      idByPhone,
      dogIds: new Map(inserted.map((seeded) => [seeded.name, seeded.id])),
    });

    console.log(`Seeded ${accounts.length} demo accounts, ${inserted.length} dogs and ${slots} assessment slots.`);
    for (const account of DEMO_ACCOUNTS) console.log(`  ${account.phoneNumber}  ${account.role}`);

    return { oldPhotoIds: oldPhotos, oldVideoKeys: removedVideoKeys, seededDogs: inserted, idByPhone };
  });

  /*------ Photos ------*/
  for (const mediaId of oldPhotoIds) await deleteMedia({ db, mediaId });
  await deleteDemoVideoObjects({ keys: oldVideoKeys });

  let uploaded = 0;
  for (const seededDog of seededDogs) {
    if (!seededDog.photoFile) continue;

    const mediaId = await uploadDogPhoto({ ownerId: seededDog.ownerId, photoFile: seededDog.photoFile });
    await db.update(dog).set({ photoMediaId: mediaId }).where(eq(dog.id, seededDog.id));
    uploaded++;
  }
  console.log(`Uploaded ${uploaded} dog photos.`);

  /*------ Training ------*/
  // After the transaction: it goes through the order flow, which runs its own database transactions.
  const { enrollments } = await seedTraining({
    db,
    idByPhone,
    dogIds: new Map(seededDogs.map((seeded) => [seeded.name, seeded.id])),
  });
  console.log(`Seeded ${enrollments} enrollments with their orders, payments and refunds.`);

  /*------ Behavior Requests ------*/
  const { requests } = await seedBehavior({
    db,
    idByPhone,
    dogIds: new Map(seededDogs.map((seeded) => [seeded.name, seeded.id])),
  });
  console.log(`Seeded ${requests} behavior requests with their videos.`);
}

await seedDemo();
await db.$client.end();
