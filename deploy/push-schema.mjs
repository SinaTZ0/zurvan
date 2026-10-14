import { pushSchema } from "drizzle-kit/api";

import { db } from "../app/db/client.server.ts";
import * as schema from "../app/db/schema.ts";

// The CLI in our Drizzle Kit version catches SQL errors and can exit with code 0.
// Use the same push engine directly so an unsuccessful push fails the deployment.
try {
  const plan = await pushSchema(schema, db);
  for (const warning of plan.warnings) console.warn(warning);
  if (plan.hasDataLoss && !process.argv.includes("--force")) {
    throw new Error("Schema changes can delete data. Review them before running with --force.");
  }
  if (plan.statementsToExecute.length === 0) {
    console.log("No schema changes detected.");
  } else {
    console.log(plan.statementsToExecute.join("\n"));
    await plan.apply();
    console.log("Schema changes applied.");
  }
} finally {
  await db.$client.end();
}
