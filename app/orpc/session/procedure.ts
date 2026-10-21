import { base } from "~/orpc/implementer.server";
import { readSessionState } from "~/orpc/session/service";

/*===== Public =====*/
// No auth middleware: page guards and the storefront header ask this to learn who is signed in.
export const getSessionProcedure = base.session.get.handler(({ context }) =>
  readSessionState({ headers: context.headers }),
);
