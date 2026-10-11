import { randomUUID } from "node:crypto";

import { inArray, sql } from "drizzle-orm";

import { db } from "~/db/client.server";
import { dog, user } from "~/db/schema";
import { env } from "~/env.server";
import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { phonePlaceholderEmail } from "~/lib/phone";

/*===== Demo Seed =====*/
// `npm run db:seed:demo`: the catalogue (`seed.ts`) plus one account per role for the owner's showcase, each signing
// in with the showcase code, and dogs for the first customer. Idempotent: accounts are upserted by phone number and
// the demo customers' dogs are replaced, so running it again resets the demo without duplicating anything.
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

async function seedDemo() {
  if (!env.SHOWCASE_MODE) {
    throw new Error("Demo accounts are for showcase mode only. Set SHOWCASE_MODE=true to seed them.");
  }

  await db.transaction(async (tx) => {
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
    await tx.delete(dog).where(
      inArray(
        dog.ownerId,
        customers.map((customer) => customer.id),
      ),
    );
    const owner = customers[0];
    if (owner) {
      // One insert shares one `now()`, so space the creation times out to keep the list in the order above.
      const start = Date.now() - DEMO_DOGS.length * 60_000;
      await tx
        .insert(dog)
        .values(
          DEMO_DOGS.map((demoDog, index) => ({
            ...demoDog,
            ownerId: owner.id,
            createdAt: new Date(start + index * 60_000),
          })),
        );
    }

    console.log(`Seeded ${accounts.length} demo accounts and ${owner ? DEMO_DOGS.length : 0} dogs.`);
    for (const account of DEMO_ACCOUNTS) console.log(`  ${account.phoneNumber}  ${account.role}`);
  });
}

await seedDemo();
await db.$client.end();
