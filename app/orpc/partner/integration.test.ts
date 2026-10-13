import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { partner, user } from "~/db/schema";
import { toPersianDigits } from "~/lib/digits";
import { phonePlaceholderEmail } from "~/lib/phone";
import { getPartnerProfile, updatePartnerProfile } from "~/orpc/partner/service";
import { SHEBA_CHECKSUM_MESSAGE, SHEBA_FORMAT_MESSAGE } from "~/orpc/partner/validation";

/*===== Partner Sheba =====*/
// Runs against the real database: the boundary is that the update only ever targets the caller's own `partner` row,
// which a mock would not exercise. Needs the `partner` table (`npm run db:push`).

const runId = randomUUID().slice(0, 8);
const partnerA = { id: `test-partner-a-${runId}`, phone: `0992${Math.floor(1000000 + Math.random() * 8999999)}` };
const partnerB = { id: `test-partner-b-${runId}`, phone: `0993${Math.floor(1000000 + Math.random() * 8999999)}` };
// A partner user whose `partner` row was never created.
const orphan = { id: `test-partner-c-${runId}`, phone: `0994${Math.floor(1000000 + Math.random() * 8999999)}` };

/** Builds a made-up Sheba number with correct check digits (ISO 7064 mod 97-10) from 22 digits of body. */
function makeSheba(body: string): string {
  // `IR00` + body, moved as the standard says: body + "1827" ("IR") + "00".
  const remainder = [...`${body}182700`].reduce((rest, digit) => (rest * 10 + Number(digit)) % 97, 0);
  return `IR${String(98 - remainder).padStart(2, "0")}${body}`;
}

const shebaA = makeSheba("0170000000123456789012");
const shebaB = makeSheba("0120000000987654321098");
// Same shape as a real one, one digit off.
const wrongChecksum = `IR${shebaA[2] === "9" ? "1" : String(Number(shebaA[2]) + 1)}${shebaA.slice(3)}`;

beforeAll(async () => {
  await db.insert(user).values(
    [partnerA, partnerB, orphan].map((entry) => ({
      id: entry.id,
      name: "Test partner",
      email: phonePlaceholderEmail(entry.phone),
      phoneNumber: entry.phone,
      role: "partner",
    })),
  );
  await db.insert(partner).values([
    { userId: partnerA.id, code: `ta${runId}` },
    { userId: partnerB.id, code: `tb${runId}` },
  ]);
});

afterAll(async () => {
  const ids = [partnerA.id, partnerB.id, orphan.id];
  // Partner rows first: they reference the users.
  await db.delete(partner).where(inArray(partner.userId, ids));
  await db.delete(user).where(inArray(user.id, ids));
  await db.$client.end();
});

describe("partner sheba number", () => {
  it("reads null until the partner writes it, and not-found without a partner row", async () => {
    expect(await getPartnerProfile({ db, userId: partnerA.id })).toEqual({
      kind: "success",
      profile: { shebaNumber: null },
    });
    expect(await getPartnerProfile({ db, userId: orphan.id })).toEqual({ kind: "not-found" });
    expect(await updatePartnerProfile({ db, userId: orphan.id, input: { shebaNumber: shebaA } })).toEqual({
      kind: "not-found",
    });
  });

  it("rejects a wrong format and a wrong checksum with the field message, storing nothing", async () => {
    const badFormat = await updatePartnerProfile({ db, userId: partnerA.id, input: { shebaNumber: "IR12 345" } });
    const badChecksum = await updatePartnerProfile({ db, userId: partnerA.id, input: { shebaNumber: wrongChecksum } });

    expect(badFormat).toMatchObject({ kind: "invalid", fields: { shebaNumber: SHEBA_FORMAT_MESSAGE } });
    expect(badChecksum).toMatchObject({ kind: "invalid", fields: { shebaNumber: SHEBA_CHECKSUM_MESSAGE } });
    expect(await getPartnerProfile({ db, userId: partnerA.id })).toMatchObject({ profile: { shebaNumber: null } });
  });

  it("stores a number typed with Persian digits and spaces, normalized, and reads it back", async () => {
    // Grouped in fours, in Persian digits, and without the leading IR: all normalized away.
    const typed = toPersianDigits(shebaA.slice(2)).replace(/(.{4})/g, "$1 ");
    const result = await updatePartnerProfile({ db, userId: partnerA.id, input: { shebaNumber: ` ${typed} ` } });

    expect(result).toEqual({ kind: "success", profile: { shebaNumber: shebaA } });
    expect(await getPartnerProfile({ db, userId: partnerA.id })).toMatchObject({ profile: { shebaNumber: shebaA } });
  });

  it("only changes the caller's own row", async () => {
    await updatePartnerProfile({ db, userId: partnerB.id, input: { shebaNumber: shebaB } });

    // A's second write leaves B alone, and B's write left A alone.
    await updatePartnerProfile({ db, userId: partnerA.id, input: { shebaNumber: shebaA.toLowerCase() } });
    const rows = await db
      .select()
      .from(partner)
      .where(inArray(partner.userId, [partnerA.id, partnerB.id]));
    const stored = Object.fromEntries(rows.map((row) => [row.userId, row.shebaNumber]));

    expect(stored).toEqual({ [partnerA.id]: shebaA, [partnerB.id]: shebaB });
    expect(await db.select().from(partner).where(eq(partner.userId, orphan.id))).toEqual([]);
  });
});
