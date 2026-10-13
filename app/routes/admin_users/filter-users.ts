import { normalizeForSearch } from "~/lib/search";
import type { AdminUser } from "~/orpc/user/contract";
import type { RoleFilter, StatusFilter } from "~/routes/admin_users/search-params";

/*===== Matching =====*/
/** Drops one leading 0, so «9120…» and «09120…» compare equal. Applied to both sides of a phone comparison. */
function stripLeadingZero(digits: string): string {
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

/**
 * Whether a phone number matches what was typed, with or without the leading 0. The stripped comparison needs
 * something left to compare, so a lone «0» doesn't match every number.
 */
function matchesPhone({ phone, typed }: { phone: string | null; typed: string }): boolean {
  if (phone === null) return false;
  const digits = normalizeForSearch(phone);
  if (digits.includes(typed)) return true;
  const strippedTyped = stripLeadingZero(typed);
  return strippedTyped !== "" && stripLeadingZero(digits).includes(strippedTyped);
}

function matchesQuery({ user, typed }: { user: AdminUser; typed: string }): boolean {
  return normalizeForSearch(user.name).includes(typed) || matchesPhone({ phone: user.phoneNumber, typed });
}

function matchesRole({ user, role }: { user: AdminUser; role: RoleFilter }): boolean {
  return role === "all" || user.role === role;
}

function matchesStatus({ user, status }: { user: AdminUser; status: StatusFilter }): boolean {
  return status === "all" || user.status === status;
}

/*===== Filtering =====*/
/** The people the Admin is looking for: the role, the status, then the search. The API's order (newest first) is kept. */
export function filterUsers({
  users,
  role,
  status,
  query,
}: {
  users: AdminUser[];
  role: RoleFilter;
  status: StatusFilter;
  query: string;
}): AdminUser[] {
  const typed = normalizeForSearch(query);
  return users.filter(
    (user) =>
      matchesRole({ user, role }) && matchesStatus({ user, status }) && (typed === "" || matchesQuery({ user, typed })),
  );
}

/*===== Counts =====*/
/**
 * The numbers on the two pill rows. Each row counts within the other row's choice (the roles among the chosen status,
 * the statuses among the chosen role), so a pill never promises people the other filter would hide. The search doesn't
 * move them.
 */
export function countUsers({ users, role, status }: { users: AdminUser[]; role: RoleFilter; status: StatusFilter }) {
  const byRole: Record<RoleFilter, number> = { all: 0, customer: 0, partner: 0, admin: 0 };
  const byStatus: Record<StatusFilter, number> = { all: 0, active: 0, blocked: 0 };
  for (const user of users) {
    if (matchesStatus({ user, status })) {
      byRole.all += 1;
      byRole[user.role] += 1;
    }
    if (matchesRole({ user, role })) {
      byStatus.all += 1;
      byStatus[user.status] += 1;
    }
  }
  return { byRole, byStatus };
}
