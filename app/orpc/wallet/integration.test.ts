import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { user, wallet, walletTransaction, walletTransactionLine } from "~/db/schema";
import { phonePlaceholderEmail } from "~/lib/phone";
import {
  createMirrorTransaction,
  createTransaction,
  InvalidTransactionError,
  userWalletId,
} from "~/orpc/wallet/service";

/*===== Money Core =====*/
// Runs against the real database: the balanced-lines rule is held by a deferred constraint trigger
// (`app/db/money-constraints.sql`, applied by `npm run db:seed`) as well as by the service, and the cached balances are
// updated in the same database transaction as the lines.

const runId = randomUUID().slice(0, 8);
const phoneBase = `098${Math.floor(10000 + Math.random() * 89999)}`;
const people = ["payer", "trainer", "partner"].map((name, index) => ({
  id: `test-wallet-${name}-${runId}`,
  phone: `${phoneBase}${String(index).padStart(3, "0")}`,
}));
const [payer, trainer, partner] = people as [(typeof people)[0], (typeof people)[0], (typeof people)[0]];

const walletIds = new Map<string, string>();
const walletOf = (person: { id: string }) => walletIds.get(person.id) ?? "";

async function balanceOf(person: { id: string }): Promise<number> {
  const [row] = await db
    .select({ balance: wallet.balance })
    .from(wallet)
    .where(eq(wallet.id, walletOf(person)));
  return row?.balance ?? Number.NaN;
}

beforeAll(async () => {
  await db.insert(user).values(
    people.map((person) => ({
      id: person.id,
      name: "Test person",
      email: phonePlaceholderEmail(person.phone),
      phoneNumber: person.phone,
    })),
  );
  for (const person of people) walletIds.set(person.id, await userWalletId({ db, userId: person.id }));
});

afterAll(async () => {
  const ids = [...walletIds.values()];
  // One database transaction: the balance trigger runs at commit, when the headers are gone along with their lines.
  await db.transaction(async (tx) => {
    const lines = await tx
      .select({ transactionId: walletTransactionLine.transactionId })
      .from(walletTransactionLine)
      .where(inArray(walletTransactionLine.walletId, ids));
    const transactionIds = [...new Set(lines.map((line) => line.transactionId))];
    if (transactionIds.length > 0) {
      await tx.delete(walletTransactionLine).where(inArray(walletTransactionLine.transactionId, transactionIds));
      // Mirrors point at their originals, so they go first.
      await tx.update(walletTransaction).set({ mirrorOfId: null }).where(inArray(walletTransaction.id, transactionIds));
      await tx.delete(walletTransaction).where(inArray(walletTransaction.id, transactionIds));
    }
    await tx.delete(wallet).where(inArray(wallet.id, ids));
  });
  await db.delete(user).where(
    inArray(
      user.id,
      people.map((person) => person.id),
    ),
  );
  await db.$client.end();
});

describe("creating a transaction", () => {
  it("writes lines that add up to 0 and moves every cached balance with them", async () => {
    const created = await createTransaction({
      db,
      transaction: {
        type: "manual",
        description: "آزمایش",
        lines: [
          { walletId: walletOf(payer), amount: -100_000 },
          { walletId: walletOf(trainer), amount: 70_000 },
          { walletId: walletOf(partner), amount: 30_000 },
        ],
      },
    });

    expect(created.sum).toBe(100_000);
    expect(created.number).toMatch(/^TX-\d{6}-\d{4,}$/);
    expect([await balanceOf(payer), await balanceOf(trainer), await balanceOf(partner)]).toEqual([
      -100_000, 70_000, 30_000,
    ]);
  });

  it("refuses lines that don't add up to 0, and writes nothing", async () => {
    const before = await balanceOf(payer);

    await expect(
      createTransaction({
        db,
        transaction: {
          type: "manual",
          description: "آزمایش",
          lines: [
            { walletId: walletOf(payer), amount: -100 },
            { walletId: walletOf(trainer), amount: 99 },
          ],
        },
      }),
    ).rejects.toBeInstanceOf(InvalidTransactionError);
    expect(await balanceOf(payer)).toBe(before);
  });

  it("is stopped by the database when a bug writes unbalanced lines past the service", async () => {
    const write = db.transaction(async (tx) => {
      const [header] = await tx
        .insert(walletTransaction)
        .values({ number: `TX-TEST-${runId}`, type: "manual", sum: 100, description: "آزمایش" })
        .returning({ id: walletTransaction.id });
      await tx.insert(walletTransactionLine).values([
        { transactionId: header!.id, walletId: walletOf(payer), amount: -100 },
        { transactionId: header!.id, walletId: walletOf(trainer), amount: 50 },
      ]);
    });

    await expect(write).rejects.toThrow();
    const leftover = await db
      .select()
      .from(walletTransaction)
      .where(eq(walletTransaction.number, `TX-TEST-${runId}`));
    expect(leftover).toHaveLength(0);
  });
});

describe("mirroring a transaction", () => {
  it("flips every line's sign, points at the original and restores the balances", async () => {
    const before = [await balanceOf(payer), await balanceOf(trainer)];
    const original = await createTransaction({
      db,
      transaction: {
        type: "manual",
        description: "آزمایش",
        lines: [
          { walletId: walletOf(payer), amount: -40_000 },
          { walletId: walletOf(trainer), amount: 40_000 },
        ],
      },
    });

    const mirror = await createMirrorTransaction({
      db,
      mirrorOfId: original.id,
      type: "manual",
      description: "بازگشت آزمایش",
    });

    expect(mirror.mirrorOfId).toBe(original.id);
    const lines = await db
      .select({ walletId: walletTransactionLine.walletId, amount: walletTransactionLine.amount })
      .from(walletTransactionLine)
      .where(eq(walletTransactionLine.transactionId, mirror.id));
    expect(lines).toEqual(
      expect.arrayContaining([
        { walletId: walletOf(payer), amount: 40_000 },
        { walletId: walletOf(trainer), amount: -40_000 },
      ]),
    );
    expect([await balanceOf(payer), await balanceOf(trainer)]).toEqual(before);
  });
});
