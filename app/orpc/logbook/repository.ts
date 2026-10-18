import { eq } from "drizzle-orm";

import type { DatabaseOrTransaction } from "~/db/client.server";
import { dog } from "~/db/schema";

/*===== Reads =====*/
/** The dog with this file number: only what deciding who may see it needs. */
export async function findDogByFileNumber({
  db,
  fileNumber,
}: {
  db: DatabaseOrTransaction;
  fileNumber: string;
}): Promise<{ id: string; ownerId: string } | undefined> {
  const [row] = await db.select({ id: dog.id, ownerId: dog.ownerId }).from(dog).where(eq(dog.fileNumber, fileNumber));
  return row;
}
