import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq, inArray, sql } from "drizzle-orm";

import { db } from "~/db/client.server";
import { dog, user } from "~/db/schema";
import { env } from "~/env.server";
import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { phonePlaceholderEmail } from "~/lib/phone";
import { attachMedia, deleteMedia, uploadMedia } from "~/orpc/media/service";

/*===== Demo Seed =====*/
// `npm run db:seed:demo`: the catalogue (`seed.ts`) plus one account per role for the owner's showcase, each signing
// in with the showcase code, and dogs (with photos) for the first customer. Idempotent: accounts are upserted by phone
// number and the demo customers' dogs are replaced, along with their photos in the bucket, so running it again resets
// the demo without duplicating anything.
//
// Showcase only: these accounts have well-known numbers and a public code, so the script refuses to run otherwise.

/** `YYYY-MM-DD` for a date `months` months before today, so the demo dogs keep their ages whenever it is seeded. */
function monthsAgo(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

/**
 * The first demo customer's dogs. The second customer has none, to show the empty state. Leo has a record (Arman
 * trained him before the site existed); Pesteh is new, so she starts with a free assessment.
 */
const DEMO_DOGS = [
  {
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

async function seedDemo() {
  if (!env.SHOWCASE_MODE) {
    throw new Error("Demo accounts are for showcase mode only. Set SHOWCASE_MODE=true to seed them.");
  }

  // Photos are uploaded and removed outside the transaction: they need the accounts committed (the media rows point at
  // their uploader), and the bucket can't be rolled back anyway.
  const { dogOwner, oldPhotoIds, seededDogs } = await db.transaction(async (tx) => {
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

    /*------ Dogs ------*/
    const customers = accounts.filter((account) =>
      DEMO_ACCOUNTS.some((demo) => demo.phoneNumber === account.phoneNumber && demo.role === "customer"),
    );
    const customerIds = customers.map((customer) => customer.id);

    // The old photos are collected before their dogs go, and deleted from the bucket once this commits.
    const oldPhotos = await tx
      .select({ mediaId: dog.photoMediaId })
      .from(dog)
      .where(inArray(dog.ownerId, customerIds))
      .then((rows) => rows.flatMap((row) => (row.mediaId ? [row.mediaId] : [])));
    await tx.delete(dog).where(inArray(dog.ownerId, customerIds));

    const owner = customers[0];
    let inserted: { id: string; photoFile: string }[] = [];
    if (owner) {
      // One insert shares one `now()`, so space the creation times out to keep the list in the order above.
      const start = Date.now() - DEMO_DOGS.length * 60_000;
      inserted = await tx
        .insert(dog)
        .values(
          DEMO_DOGS.map(({ photoFile: _photoFile, ...demoDog }, index) => ({
            ...demoDog,
            ownerId: owner.id,
            createdAt: new Date(start + index * 60_000),
          })),
        )
        .returning({ id: dog.id, name: dog.name })
        .then((rows) =>
          rows.flatMap((row) => {
            const demoDog = DEMO_DOGS.find((candidate) => candidate.name === row.name);
            return demoDog ? [{ id: row.id, photoFile: demoDog.photoFile }] : [];
          }),
        );
    }

    console.log(`Seeded ${accounts.length} demo accounts and ${inserted.length} dogs.`);
    for (const account of DEMO_ACCOUNTS) console.log(`  ${account.phoneNumber}  ${account.role}`);

    return { dogOwner: owner, oldPhotoIds: oldPhotos, seededDogs: inserted };
  });

  /*------ Photos ------*/
  for (const mediaId of oldPhotoIds) await deleteMedia({ db, mediaId });

  if (dogOwner) {
    for (const seededDog of seededDogs) {
      const mediaId = await uploadDogPhoto({ ownerId: dogOwner.id, photoFile: seededDog.photoFile });
      await db.update(dog).set({ photoMediaId: mediaId }).where(eq(dog.id, seededDog.id));
    }
    console.log(`Uploaded ${seededDogs.length} dog photos.`);
  }
}

await seedDemo();
await db.$client.end();
