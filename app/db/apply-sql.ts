import { readFile } from "node:fs/promises";
import path from "node:path";

import { sql } from "drizzle-orm";

import type { Database } from "~/db/client.server";

/*===== Hand-Written SQL =====*/
// Database objects Drizzle Kit doesn't manage (functions and constraint triggers), kept in `.sql` files next to the
// schema. Each file is idempotent, so applying it after every schema push is safe.

const SQL_FILES = ["money-constraints.sql"];

/** Applies every hand-written SQL file, in order. */
export async function applyHandWrittenSql(db: Database): Promise<void> {
  for (const file of SQL_FILES) {
    const text = await readFile(path.join(import.meta.dirname, file), "utf8");
    await db.execute(sql.raw(text));
  }
}
