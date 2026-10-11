import { randomUUID } from "node:crypto";

import { inArray, sql } from "drizzle-orm";

import { db } from "~/db/client.server";
import { pet, user } from "~/db/schema";
import { env } from "~/env.server";
import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { phonePlaceholderEmail } from "~/lib/phone";

/*===== Demo Seed =====*/
// `npm run db:seed:demo`: the catalogue (`seed.ts`) plus one account per role for the owner's showcase, each signing
// in with the showcase code, and dogs for the first customer. Idempotent: accounts are upserted by phone number and
// the demo customers' dogs are replaced, so running it again resets the demo without duplicating anything.
//
// Showcase only: these accounts have well-known numbers and a public code, so the script refuses to run otherwise.

/** The first demo customer's dogs. The second customer has none, to show the empty state. */
const DEMO_DOGS = [
  { name: "لئو", breed: "ژرمن شپرد", ageYears: 3 },
  { name: "پسته", breed: "پامرانین", ageYears: 1 },
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
    await tx.delete(pet).where(
      inArray(
        pet.ownerId,
        customers.map((customer) => customer.id),
      ),
    );
    const owner = customers[0];
    if (owner) {
      await tx.insert(pet).values(DEMO_DOGS.map((dog) => ({ ...dog, ownerId: owner.id, species: "dog" })));
    }

    console.log(`Seeded ${accounts.length} demo accounts and ${owner ? DEMO_DOGS.length : 0} dogs.`);
    for (const account of DEMO_ACCOUNTS) console.log(`  ${account.phoneNumber}  ${account.role}`);
  });
}

await seedDemo();
await db.$client.end();
