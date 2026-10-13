import type { DatabaseOrTransaction } from "~/db/client.server";
import { revokeUserSessions } from "~/lib/auth.server";
import { issuesToErrorData } from "~/lib/schema-issues";
import type { UserStatus } from "~/lib/user-constants";
import type { AdminUser } from "~/orpc/user/contract";
import { toAdminUser } from "~/orpc/user/mapper";
import { findUsers, updateUserNames, updateUserStatus } from "~/orpc/user/repository";
import { updateUserInputSchema } from "~/orpc/user/validation";

/*===== Types =====*/
type Caller = { db: DatabaseOrTransaction; callerId: string };

type NotFoundResult = { kind: "not-found" };
type InvalidResult = { kind: "invalid"; errors: string[]; fields: Record<string, string> };

/*===== Messages =====*/
const BLOCK_SELF_MESSAGE = "نمی‌شود حساب خودت را مسدود کنی.";
const BLOCK_ADMIN_MESSAGE = "حساب مدیر مسدود نمی‌شود.";

/*===== Read =====*/
/** Reads one user back as the Admin sees him, or `undefined` when there is none. */
async function loadUser({ db, callerId, id }: Caller & { id: string }): Promise<AdminUser | undefined> {
  const [record] = await findUsers({ db, id });
  return record ? toAdminUser({ record, callerId }) : undefined;
}

/*===== List =====*/
/** F1: every user, newest first, with dog counts, in one query. */
export async function adminListUsers({ db, callerId }: Caller): Promise<AdminUser[]> {
  const records = await findUsers({ db });
  return records.map((record) => toAdminUser({ record, callerId }));
}

/*===== Update =====*/
type UpdateUserResult = { kind: "success"; user: AdminUser } | InvalidResult | NotFoundResult;

/**
 * F1: the Admin fixes a misspelt name. Only the names change (phone and role never do); `name` is rewritten with them.
 * An id that matches nobody, malformed or not, is `not-found`.
 */
export async function updateUser({
  db,
  callerId,
  id,
  input,
}: Caller & { id: string; input: { firstName: string; lastName: string } }): Promise<UpdateUserResult> {
  /*------ Validate ------*/
  const parsed = updateUserInputSchema.safeParse(input);
  if (!parsed.success) return { kind: "invalid", ...issuesToErrorData(parsed.error.issues) };

  /*------ Store ------*/
  if (!(await updateUserNames({ db, id, ...parsed.data }))) return { kind: "not-found" };

  const updated = await loadUser({ db, callerId, id });
  return updated ? { kind: "success", user: updated } : { kind: "not-found" };
}

/*===== Set Status =====*/
type SetStatusResult = { kind: "success"; user: AdminUser } | InvalidResult | NotFoundResult;

/**
 * F1: blocks or unblocks a user. A reversible switch, so it is idempotent. The Admin can't block himself or any admin
 * (nobody could open the account again). Unblocking only flips the status.
 *
 * Blocking writes the status first and then deletes the user's sessions, and does so on every call, even when he is
 * already blocked: the status is already closed to him (the API middleware refuses a blocked user's live session), so
 * a failed revoke is thrown rather than swallowed and a retry heals it. Nothing else about the user is touched: a
 * partner's row, link and leads and a customer's dogs and payments stay.
 */
export async function setUserStatus({
  db,
  callerId,
  id,
  status,
}: Caller & { id: string; status: UserStatus }): Promise<SetStatusResult> {
  /*------ Find ------*/
  const [target] = await findUsers({ db, id });
  if (!target) return { kind: "not-found" };

  /*------ Who may be blocked ------*/
  if (status === "blocked") {
    if (target.id === callerId) return { kind: "invalid", errors: [BLOCK_SELF_MESSAGE], fields: {} };
    if (target.role === "admin") return { kind: "invalid", errors: [BLOCK_ADMIN_MESSAGE], fields: {} };
  }

  /*------ Store ------*/
  if (!(await updateUserStatus({ db, id, status }))) return { kind: "not-found" };
  if (status === "blocked") await revokeUserSessions(id);

  const updated = await loadUser({ db, callerId, id });
  return updated ? { kind: "success", user: updated } : { kind: "not-found" };
}
