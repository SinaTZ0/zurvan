import type { AdminUser } from "~/orpc/user/contract";
import type { UserRecord } from "~/orpc/user/repository";
import type { UserRole, UserStatus } from "~/lib/user-constants";

/*===== Admin =====*/
/**
 * A user as the Admin sees him. `role` and `status` are plain text in the database, so they are narrowed here; the
 * values are only ever written from the constants. `isSelf` is the one thing the row cannot know: the caller's id.
 */
export function toAdminUser({ record, callerId }: { record: UserRecord; callerId: string }): AdminUser {
  return {
    id: record.id,
    name: record.name,
    firstName: record.firstName ?? "",
    lastName: record.lastName ?? "",
    phoneNumber: record.phoneNumber,
    role: record.role as UserRole,
    status: record.status as UserStatus,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    dogCount: record.dogCount,
    isSelf: record.id === callerId,
  };
}
