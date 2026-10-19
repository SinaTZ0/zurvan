import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";

// Prints the SQL that takes a database in the schema of an older revision to the current schema, from Drizzle Kit's own diff
// of the two `app/db/schema.ts` files. No database is read, nothing is applied, and `deploy.sh --db-push` is not involved:
// its push cannot read a table with a composite primary key (docs/deploy.md), so a schema change on a database that has data
// goes through a reviewed SQL file like this one instead (docs/overnight/04-DEPLOYMENT-AND-ROLLBACK.md).
//
//   node --import tsx deploy/schema-diff.mjs <the revision the live site runs, e.g. 1b7a29d> > upgrade.sql
//
// Read the output before it goes anywhere near a database: it should only add. Put it in a transaction (BEGIN … COMMIT),
// try it on a restored copy of a backup first, and apply it before deploying the code that needs it.
const [revision] = process.argv.slice(2);
if (!revision) {
  console.error("Usage: node --import tsx deploy/schema-diff.mjs <git revision of the live schema>");
  process.exit(2);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const oldSource = execFileSync("git", ["show", `${revision}:app/db/schema.ts`], { cwd: root, encoding: "utf8" });

// Inside the repository, so that the old file finds `drizzle-orm` the way the current one does.
const scratch = join(root, "node_modules", ".cache", "schema-diff");
mkdirSync(scratch, { recursive: true });
const oldFile = join(scratch, "old-schema.ts");
writeFileSync(oldFile, oldSource);

try {
  const oldSchema = await import(pathToFileURL(oldFile).href);
  const newSchema = await import("../app/db/schema.ts");
  const previous = generateDrizzleJson(oldSchema);
  const current = generateDrizzleJson(newSchema, previous.id);
  const statements = await generateMigration(previous, current);
  console.log(statements.join("\n\n"));
  console.error(`-- ${statements.length} statements`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
