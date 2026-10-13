import { eq, inArray } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { platformSetting } from "~/db/schema";
import { SETTING_KEYS, type SettingKey } from "~/orpc/setting/constants";

/*===== Types =====*/
type Executor = { db: DatabaseOrTransaction };

export type SettingRecord = typeof platformSetting.$inferSelect;

/*===== Reads =====*/
/** The stored rows of the settings that exist; a setting never saved has no row. */
export async function findSettingRows({ db }: Executor): Promise<SettingRecord[]> {
  return db
    .select()
    .from(platformSetting)
    .where(inArray(platformSetting.key, [...SETTING_KEYS]));
}

export async function findSettingRow({ db, key }: Executor & { key: SettingKey }): Promise<SettingRecord | undefined> {
  const [row] = await db.select().from(platformSetting).where(eq(platformSetting.key, key));
  return row;
}

/*===== Writes =====*/
/** Upsert on the key; the value is stored as text and `updated_at` is set by the column on both paths. */
export async function upsertSetting({
  db,
  key,
  value,
}: Executor & { key: SettingKey; value: number }): Promise<SettingRecord> {
  const [row] = await db
    .insert(platformSetting)
    .values({ key, value: String(value) })
    .onConflictDoUpdate({ target: platformSetting.key, set: { value: String(value), updatedAt: new Date() } })
    .returning();
  if (!row) throw new Error("Could not save the setting.");
  return row;
}
