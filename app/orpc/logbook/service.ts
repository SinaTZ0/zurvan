import type { DatabaseOrTransaction } from "~/db/client.server";
import { normalizeFileNumber } from "~/lib/dog-file";
import type { UserRole } from "~/lib/user-constants";
import { findDogByFileNumber } from "~/orpc/logbook/repository";

/*===== Locate =====*/
/**
 * Where this person's own page for the dog with this file number is. The Admin's is any dog's; a customer's is their own
 * dog's; nobody else gets one, and neither does a number that is malformed or doesn't exist: all of those are `null`.
 */
export async function locateDog({
  db,
  user,
  fileNumber,
}: {
  db: DatabaseOrTransaction;
  user: { id: string; role: UserRole };
  fileNumber: string;
}): Promise<{ path: string } | null> {
  const normalized = normalizeFileNumber(fileNumber);
  if (!normalized) return null;

  const found = await findDogByFileNumber({ db, fileNumber: normalized });
  if (!found) return null;

  if (user.role === "admin") return { path: `/admin/dogs/${found.id}` };
  if (user.role === "customer" && found.ownerId === user.id) return { path: `/account/dogs/${found.id}` };
  return null;
}
