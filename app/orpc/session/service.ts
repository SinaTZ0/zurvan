import { authForHeaders, revokeUserSessions } from "~/lib/auth.server";
import { USER_ROLES, type UserRole } from "~/lib/user-constants";
import type { SessionState } from "~/orpc/session/contract";

/*===== Read the Session =====*/
/**
 * Reads the request's session and sorts it into `SessionState`.
 *
 * Side effect: a blocked account's sessions are all revoked before it reads as `anonymous`. Without that, the sign-in
 * page would see the session and send the person straight back to the page that refused them.
 */
export async function readSessionState({ headers }: { headers: Headers }): Promise<SessionState> {
  const session = await authForHeaders(headers).api.getSession({ headers });
  if (!session) return { status: "anonymous" };

  const { user } = session;
  if (user.status === "blocked") {
    await revokeUserSessions(user.id);
    return { status: "anonymous" };
  }

  // Better-Auth types additional fields as optional strings; the column only ever holds a known role.
  const role = user.role as UserRole;
  if (!USER_ROLES.includes(role)) return { status: "anonymous" };

  const phoneNumber = user.phoneNumber ?? null;
  if (!user.firstName) return { status: "unnamed", user: { id: user.id, role, phoneNumber } };

  return {
    status: "active",
    user: { id: user.id, role, firstName: user.firstName, lastName: user.lastName ?? "", phoneNumber },
  };
}
