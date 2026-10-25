import { randomUUID } from "node:crypto";

import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "~/db/client.server";
import { commission, partner, payment, platformSetting, user } from "~/db/schema";
import {
  DEFAULT_DEPOSIT_PERCENT,
  DEFAULT_OTP_REQUESTS_PER_IP_PER_HOUR,
  DEFAULT_OTP_REQUESTS_PER_PHONE_PER_HOUR,
} from "~/lib/business-rules";
import { phonePlaceholderEmail } from "~/lib/phone";
import { readDepositPercent, readOtpLimits } from "~/lib/platform-settings.server";
import { recordPurchaseCommission } from "~/orpc/commission/service";
import { getPartnerProfile } from "~/orpc/partner/service";
import {
  COMMISSION_TIERS_KEY,
  DEPOSIT_PERCENT_KEY,
  OTP_PER_IP_KEY,
  OTP_PER_PHONE_KEY,
  SETTING_DEFINITIONS,
  SETTING_KEYS,
} from "~/orpc/setting/constants";
import {
  adminGetCommissionTiers,
  adminGetSettings,
  getCommissionTiers,
  updateCommissionTiers,
  updateSetting,
} from "~/orpc/setting/service";

/*===== Platform Settings =====*/
// Runs against the real database: the settings are read by the commission and by sign-in, which only a real table shows.
// The keys are shared state, so their rows are saved up front and put back afterwards.

const runId = randomUUID().slice(0, 8);
const partnerUser = {
  id: `test-setting-partner-${runId}`,
  phone: `0995${Math.floor(1000000 + Math.random() * 8999999)}`,
};
const customers = [1, 2].map((index) => ({
  id: `test-setting-customer-${index}-${runId}`,
  phone: `0996${Math.floor(1000000 + Math.random() * 8999999)}`,
}));
const ALL_KEYS = [...SETTING_KEYS, COMMISSION_TIERS_KEY];
let savedRows: (typeof platformSetting.$inferSelect)[] = [];

beforeAll(async () => {
  savedRows = await db.select().from(platformSetting).where(inArray(platformSetting.key, ALL_KEYS));

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

  // Put the keys back exactly as they were: rows that existed return with their values, the others are removed.
  await db.delete(platformSetting).where(inArray(platformSetting.key, ALL_KEYS));
  if (savedRows.length > 0) await db.insert(platformSetting).values(savedRows);
  await db.$client.end();
});

/** A paid purchase, written the way the payment callback does: a paid payment, then the commission. Returns its percent. */
async function buy({ customerId, baseAmount }: { customerId: string; baseAmount: number }) {
  const [paid] = await db
    .insert(payment)
    .values({
      customerId,
      amount: baseAmount,
      gateway: "demo",
      authority: `test-setting-${runId}-${randomUUID()}`,
      status: "paid",
      paidAt: new Date(),
    })
    .returning({ id: payment.id });
  if (!paid) throw new Error("Could not insert the test payment.");
  expect(await recordPurchaseCommission({ db, customerId, paymentId: paid.id, baseAmount })).toBe(true);
  const [row] = await db.select().from(commission).where(eq(commission.paymentId, paid.id));
  return row?.percent;
}

async function storedRows() {
  return db.select().from(platformSetting).where(inArray(platformSetting.key, ALL_KEYS));
}

const [first, second] = customers as [(typeof customers)[number], (typeof customers)[number]];

/** Five steps (always five), from customers 1 to 5, with these percents. */
const steps = (...percents: number[]) => percents.map((percent, index) => ({ fromCustomer: index + 1, percent }));

describe("platform settings", () => {
  it("writes every purchase at the step the partner's paying customers are on, and a change applies from the next", async () => {
    expect(
      await updateCommissionTiers({ db, tiers: steps(10, 15, 15, 15, 15) }),
    ).toMatchObject({ kind: "success" });

    // The first customer is on the first step, and buying again doesn't make them a second customer.
    expect(await buy({ customerId: first.id, baseAmount: 10_000_000 })).toBe(10);
    expect(await buy({ customerId: first.id, baseAmount: 10_000_000 })).toBe(10);
    // The second customer lifts the partner a step, and from then on the first one's purchases are on it too.
    expect(await buy({ customerId: second.id, baseAmount: 10_000_000 })).toBe(15);
    expect(await buy({ customerId: first.id, baseAmount: 10_000_000 })).toBe(15);
    expect(await getPartnerProfile({ db, userId: partnerUser.id })).toMatchObject({
      profile: { payingCustomers: 2 },
    });

    // New steps apply to the next commission; those already written keep their percent.
    await updateCommissionTiers({ db, tiers: steps(20, 20, 20, 20, 20) });
    expect(await buy({ customerId: second.id, baseAmount: 10_000_000 })).toBe(20);
    const written = await db.select().from(commission).where(eq(commission.partnerId, partnerUser.id));
    expect(written.map((row) => row.percent)).toEqual(expect.arrayContaining([10, 10, 15, 15, 20]));
    expect(written).toHaveLength(5);
    expect(await getCommissionTiers({ db })).toEqual({ tiers: steps(20, 20, 20, 20, 20) });
  });

  it("refuses steps that make no table, writing nothing", async () => {
    const before = await adminGetCommissionTiers({ db });
    const attempts = [
      // Not five steps.
      steps(10, 12, 15, 18),
      steps(10, 12, 15, 18, 18, 18),
      // Not from the first customer, or not each from a later one.
      steps(10, 12, 15, 18, 18).map((tier) => ({ ...tier, fromCustomer: tier.fromCustomer + 1 })),
      steps(10, 12, 15, 18, 18).map((tier, index) => (index === 2 ? { ...tier, fromCustomer: 2 } : tier)),
      // A percent out of bounds or not whole.
      steps(10, 12, 15, 18, 51),
      steps(10, 12, 15.5, 18, 18),
    ];

    for (const tiers of attempts) {
      expect(await updateCommissionTiers({ db, tiers })).toMatchObject({ kind: "invalid", fields: { tiers: expect.any(String) } });
    }
    expect(await adminGetCommissionTiers({ db })).toEqual(before);
  });

  it("refuses a number setting outside the bounds or not a whole number, writing nothing", async () => {
    const before = await storedRows();
    const attempts = [
      { key: DEPOSIT_PERCENT_KEY, value: 0 },
      { key: DEPOSIT_PERCENT_KEY, value: 10.5 },
      { key: DEPOSIT_PERCENT_KEY, value: Number.NaN },
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
      { key: DEPOSIT_PERCENT_KEY },
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

  it("makes the deposit follow the setting, 100 (the whole price) until one is set, and 100 again for a corrupt value", async () => {
    await db.delete(platformSetting).where(eq(platformSetting.key, DEPOSIT_PERCENT_KEY));
    expect(await readDepositPercent({ db })).toBe(DEFAULT_DEPOSIT_PERCENT);
    expect(DEFAULT_DEPOSIT_PERCENT).toBe(100);

    expect(await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value: 50 })).toMatchObject({
      kind: "success",
      setting: { key: DEPOSIT_PERCENT_KEY, value: 50, defaultValue: 100, min: 1, max: 100 },
    });
    expect(await readDepositPercent({ db })).toBe(50);

    // The bounds are guardrails against a typo: nothing under 1 or over 100, and whole numbers only.
    for (const value of [0, 101, 49.5, Number.NaN]) {
      expect(await updateSetting({ db, key: DEPOSIT_PERCENT_KEY, value })).toEqual({
        kind: "invalid",
        fields: { value: SETTING_DEFINITIONS[DEPOSIT_PERCENT_KEY].invalidMessage },
      });
    }
    expect(await readDepositPercent({ db })).toBe(50);

    // A hand-edited row must not start a payment at a percent nobody chose.
    for (const corrupt of ["half", "0", "150", "33.3"]) {
      await db.update(platformSetting).set({ value: corrupt }).where(eq(platformSetting.key, DEPOSIT_PERCENT_KEY));
      expect({ corrupt, percent: await readDepositPercent({ db }) }).toEqual({ corrupt, percent: 100 });
    }
  });
});
