import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { commission, partner, payment, platformSetting, user } from "~/db/schema";
import { DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR, DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR } from "~/lib/business-rules";
import { phonePlaceholderEmail } from "~/lib/phone";
import { readOtpLimits } from "~/lib/platform-settings.server";
import { recordFirstPurchaseCommission } from "~/orpc/commission/service";
import { getPartnerProfile } from "~/orpc/partner/service";
import {
  COMMISSION_PERCENT_KEY,
  OTP_PER_IP_KEY,
  OTP_PER_PHONE_KEY,
  SETTING_DEFINITIONS,
  SETTING_KEYS,
} from "~/orpc/setting/constants";
import { adminGetSettings, getCommissionPercent, updateSetting } from "~/orpc/setting/service";

/*===== Platform Settings =====*/
// Runs against the real database: the settings are read by the commission and by sign-in, which only a real table shows.
// The three keys are shared state, so their rows are saved up front and put back afterwards.

const runId = randomUUID().slice(0, 8);
const partnerUser = {
  id: `test-setting-partner-${runId}`,
  phone: `0995${Math.floor(1000000 + Math.random() * 8999999)}`,
};
const customers = [1, 2].map((index) => ({
  id: `test-setting-customer-${index}-${runId}`,
  phone: `0996${Math.floor(1000000 + Math.random() * 8999999)}`,
}));
let savedRows: (typeof platformSetting.$inferSelect)[] = [];

beforeAll(async () => {
  savedRows = await db
    .select()
    .from(platformSetting)
    .where(inArray(platformSetting.key, [...SETTING_KEYS]));

  await db.insert(user).values({
    id: partnerUser.id,
    name: "Test partner",
    email: phonePlaceholderEmail(partnerUser.phone),
    phoneNumber: partnerUser.phone,
    role: "partner",
  });
  await db.insert(partner).values({ userId: partnerUser.id, code: `ts${runId}` });
  await db.insert(user).values(
    customers.map((customer) => ({
      id: customer.id,
      name: "Test customer",
      email: phonePlaceholderEmail(customer.phone),
      phoneNumber: customer.phone,
      referredByPartnerId: partnerUser.id,
    })),
  );
});

afterAll(async () => {
  const customerIds = customers.map((customer) => customer.id);
  await db.delete(commission).where(inArray(commission.customerId, customerIds));
  await db.delete(payment).where(inArray(payment.customerId, customerIds));
  await db.delete(user).where(inArray(user.id, customerIds));
  await db.delete(partner).where(eq(partner.userId, partnerUser.id));
  await db.delete(user).where(eq(user.id, partnerUser.id));

  // Put the three keys back exactly as they were: rows that existed return with their values, the others are removed.
  await db.delete(platformSetting).where(inArray(platformSetting.key, [...SETTING_KEYS]));
  if (savedRows.length > 0) await db.insert(platformSetting).values(savedRows);
  await db.$client.end();
});

/** The customer's first paid purchase, written the way the payment callback does: a paid payment, then the commission. */
async function buy({ customerId, baseAmount }: { customerId: string; baseAmount: number }) {
  const [paid] = await db
    .insert(payment)
    .values({
      customerId,
      amount: baseAmount,
      gateway: "demo",
      authority: `test-setting-${runId}-${customerId}`,
      status: "paid",
      paidAt: new Date(),
    })
    .returning({ id: payment.id });
  if (!paid) throw new Error("Could not insert the test payment.");
  return recordFirstPurchaseCommission({ db, customerId, paymentId: paid.id, baseAmount });
}

async function commissionOf(customerId: string) {
  const [row] = await db.select().from(commission).where(eq(commission.customerId, customerId));
  return row;
}

async function storedRows() {
  return db
    .select()
    .from(platformSetting)
    .where(inArray(platformSetting.key, [...SETTING_KEYS]));
}

const [first, second] = customers as [(typeof customers)[number], (typeof customers)[number]];

describe("platform settings", () => {
  it("picks a change up, and each commission keeps the percent it was written with", async () => {
    expect(await updateSetting({ db, key: COMMISSION_PERCENT_KEY, value: 10 })).toMatchObject({ kind: "success" });
    expect(await buy({ customerId: first.id, baseAmount: 10_000_000 })).toBe(true);

    expect(await updateSetting({ db, key: COMMISSION_PERCENT_KEY, value: 15 })).toMatchObject({
      kind: "success",
      setting: { key: COMMISSION_PERCENT_KEY, value: 15, defaultValue: 10, min: 1, max: 50 },
    });
    expect(await buy({ customerId: second.id, baseAmount: 10_000_000 })).toBe(true);

    expect(await commissionOf(first.id)).toMatchObject({ percent: 10, amount: 1_000_000 });
    expect(await commissionOf(second.id)).toMatchObject({ percent: 15, amount: 1_500_000 });
    expect(await getPartnerProfile({ db, userId: partnerUser.id })).toMatchObject({
      profile: { commissionPercent: 15 },
    });
    expect(await getCommissionPercent({ db })).toEqual({ percent: 15 });
  });

  it("refuses a value outside the bounds or not a whole number, writing nothing", async () => {
    const before = await storedRows();
    const attempts = [
      { key: COMMISSION_PERCENT_KEY, value: 0 },
      { key: COMMISSION_PERCENT_KEY, value: 51 },
      { key: COMMISSION_PERCENT_KEY, value: 10.5 },
      { key: COMMISSION_PERCENT_KEY, value: Number.NaN },
      { key: OTP_PER_IP_KEY, value: 4 },
    ] as const;

    for (const attempt of attempts) {
      expect(await updateSetting({ db, ...attempt })).toEqual({
        kind: "invalid",
        fields: { value: SETTING_DEFINITIONS[attempt.key].invalidMessage },
      });
    }

    expect(await storedRows()).toEqual(before);
  });

  it("makes the sign-in limits follow the setting, falling back to the default for a corrupt value", async () => {
    await db.delete(platformSetting).where(inArray(platformSetting.key, [OTP_PER_PHONE_KEY, OTP_PER_IP_KEY]));
    expect(await readOtpLimits({ db })).toEqual({
      perPhone: DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR,
      perIp: DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR,
    });

    await updateSetting({ db, key: OTP_PER_PHONE_KEY, value: 3 });
    await updateSetting({ db, key: OTP_PER_IP_KEY, value: 50 });
    expect(await readOtpLimits({ db })).toEqual({ perPhone: 3, perIp: 50 });
    expect(await adminGetSettings({ db })).toMatchObject([
      { key: COMMISSION_PERCENT_KEY },
      { key: OTP_PER_PHONE_KEY, value: 3, updatedAt: expect.any(Date) },
      { key: OTP_PER_IP_KEY, value: 50 },
    ]);

    // A hand-edited row (not a number, or past the bounds) must not lock sign-in out or switch the limit off.
    await db.update(platformSetting).set({ value: "many" }).where(eq(platformSetting.key, OTP_PER_PHONE_KEY));
    await db.update(platformSetting).set({ value: "9999" }).where(eq(platformSetting.key, OTP_PER_IP_KEY));
    expect(await readOtpLimits({ db })).toEqual({
      perPhone: DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR,
      perIp: DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR,
    });
  });
});
