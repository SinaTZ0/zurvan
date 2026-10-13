import { randomUUID } from "node:crypto";

import { count, eq } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { smsOutbox } from "~/db/schema";
import { SMS_PAGE_SIZE, type SmsKind } from "~/orpc/sms/constants";
import { listSms } from "~/orpc/sms/service";

/*===== SMS Outbox =====*/
// Runs against the real database. The outbox is shared (the demo seed, other tests), so every case compares a read
// before inserting with one after, and only its own rows (tagged with a unique phone number and body) are asserted
// on in order. Needs the schema (`npm run db:push`).

const runId = randomUUID().slice(0, 8);
const runPhone = `0999${Math.floor(1_000_000 + Math.random() * 8_999_999)}`;
// Future-dated, so the rows are the newest in the table and the order is the same as in a table of only these rows.
const FUTURE = Date.now() + 24 * 3_600_000;
const KIND_A: SmsKind = "sign-in-code";
const KIND_B: SmsKind = "commission-paid";

const bodyOf = (index: number) => `${runId}-${index}`;

afterAll(async () => {
  await db.delete(smsOutbox).where(eq(smsOutbox.phoneNumber, runPhone));
  await db.$client.end();
});

describe("the SMS outbox", () => {
  it("lists newest first, pages by 30, filters by kind while the counts keep every kind, and clamps past the end", async () => {
    const before = await listSms({ db, page: 0 });
    const beforeA = await listSms({ db, kind: KIND_A, page: 0 });

    // 35 messages: 20 of kind A and 15 of kind B, interleaved. Index 34 is the newest.
    const rows = Array.from({ length: 35 }, (_, index) => ({
      phoneNumber: runPhone,
      kind: index % 7 < 4 ? KIND_A : KIND_B,
      body: bodyOf(index),
      createdAt: new Date(FUTURE + index * 1000),
    }));
    await db.insert(smsOutbox).values(rows);

    // Newest first: the highest index is the newest row.
    const expectedBodies = Array.from({ length: 35 }, (_, index) => bodyOf(34 - index));
    const firstPage = await listSms({ db, page: 0 });
    const secondPage = await listSms({ db, page: 1 });

    expect(firstPage.items.map((item) => item.body)).toEqual(expectedBodies.slice(0, SMS_PAGE_SIZE));
    expect(secondPage.items.map((item) => item.body).slice(0, 35 - SMS_PAGE_SIZE)).toEqual(
      expectedBodies.slice(SMS_PAGE_SIZE),
    );
    const mine = [...firstPage.items, ...secondPage.items.slice(0, 35 - SMS_PAGE_SIZE)];
    for (let index = 1; index < mine.length; index++) {
      expect(mine[index - 1]!.createdAt.getTime()).toBeGreaterThan(mine[index]!.createdAt.getTime());
    }
    expect(firstPage.total - before.total).toBe(35);

    const filtered = await listSms({ db, kind: KIND_A, page: 0 });
    const kindARows = expectedBodies.filter((_, index) => rows[34 - index]?.kind === KIND_A);
    expect(filtered.total - beforeA.total).toBe(20);
    expect(filtered.items.slice(0, 20).map((item) => item.body)).toEqual(kindARows);
    expect(filtered.items.every((item) => item.kind === KIND_A)).toBe(true);
    expect(filtered.kindCounts).toEqual(firstPage.kindCounts);
    expect(filtered.kindCounts[KIND_A]! - (before.kindCounts[KIND_A] ?? 0)).toBe(20);
    expect(filtered.kindCounts[KIND_B]! - (before.kindCounts[KIND_B] ?? 0)).toBe(15);

    const pastEnd = await listSms({ db, kind: KIND_A, page: 999 });
    expect(pastEnd.items).toEqual([]);
    expect(pastEnd.total).toBe(filtered.total);
  });

  it("writes nothing, and a row with a kind outside SMS_KINDS appears in neither items, total nor kindCounts", async () => {
    const before = await listSms({ db, page: 0 });
    const [rowsBefore] = await db.select({ value: count() }).from(smsOutbox);

    const [retired] = await db
      .insert(smsOutbox)
      .values({
        phoneNumber: runPhone,
        kind: "retired-kind",
        body: bodyOf(999),
        createdAt: new Date(FUTURE + 999_000),
      })
      .returning({ id: smsOutbox.id });
    const [rowsAfterInsert] = await db.select({ value: count() }).from(smsOutbox);
    expect((rowsAfterInsert?.value ?? 0) - (rowsBefore?.value ?? 0)).toBe(1);

    const after = await listSms({ db, page: 0 });
    const [rowsAfterList] = await db.select({ value: count() }).from(smsOutbox);

    expect(rowsAfterList?.value).toBe(rowsAfterInsert?.value);
    expect(after.items.some((item) => item.id === retired?.id)).toBe(false);
    expect(after.total).toBe(before.total);
    expect(Object.keys(after.kindCounts)).not.toContain("retired-kind");
    expect(after.kindCounts).toEqual(before.kindCounts);
  });
});
