import type { Database, DatabaseOrTransaction } from "~/db/client.server";
import { clearSignInFailures } from "~/lib/sign-in-failures.server";
import { PASSWORD_CHANGE_FRESH_MINUTES } from "~/lib/user-constants";
import type { PasswordStatus } from "~/orpc/password/contract";
import {
  deleteOtherSessions,
  findCredentialAccountId,
  insertCredentialAccount,
  updateCredentialPassword,
} from "~/orpc/password/repository";
import { describeWeakPassword } from "~/orpc/password/validation";

/*===== Status =====*/
export async function getPasswordStatus({
  db,
  userId,
}: {
  db: DatabaseOrTransaction;
  userId: string;
}): Promise<PasswordStatus> {
  const credential = await findCredentialAccountId({ db, userId });
  return { hasPassword: credential?.hasPassword ?? false };
}

/*===== Set or Replace =====*/
export type SetPasswordResult =
  | { kind: "success"; replaced: boolean }
  | { kind: "invalid"; fields: Record<string, string> }
  | { kind: "session-too-old" };

/**
 * Sets the person's password, or replaces the one they have. Allowed only for a session that is no older than
 * `PASSWORD_CHANGE_FRESH_MINUTES`: the session proves the person has just signed in (with a code or with the old
 * password), which is what lets a forgotten password be replaced without a separate reset flow. The hash is made by the
 * caller (Better-Auth's own hasher), so no plaintext or hashing detail lives here; every other session is signed out.
 * Having just proved the number is theirs, the person also starts with a clean count of wrong passwords, so someone who
 * forgot theirs and was paused while guessing isn't kept waiting once the new one is set.
 */
export async function setPassword({
  db,
  userId,
  phoneNumber,
  newPassword,
  sessionToken,
  sessionCreatedAt,
  hash,
  now = new Date(),
}: {
  db: Database;
  userId: string;
  phoneNumber: string | null;
  newPassword: string;
  sessionToken: string;
  sessionCreatedAt: Date;
  hash: (password: string) => Promise<string>;
  now?: Date;
}): Promise<SetPasswordResult> {
  const weakness = describeWeakPassword({ password: newPassword, phoneNumber });
  if (weakness) return { kind: "invalid", fields: { newPassword: weakness } };

  const ageMinutes = (now.getTime() - sessionCreatedAt.getTime()) / 60_000;
  if (ageMinutes > PASSWORD_CHANGE_FRESH_MINUTES) return { kind: "session-too-old" };

  const passwordHash = await hash(newPassword);

  return db.transaction(async (tx) => {
    const credential = await findCredentialAccountId({ db: tx, userId });
    if (credential) await updateCredentialPassword({ db: tx, accountRowId: credential.id, passwordHash });
    else await insertCredentialAccount({ db: tx, userId, passwordHash });

    await deleteOtherSessions({ db: tx, userId, keepToken: sessionToken });
    if (phoneNumber) await clearSignInFailures({ db: tx, phoneNumber });
    return { kind: "success", replaced: credential?.hasPassword ?? false } as const;
  });
}
