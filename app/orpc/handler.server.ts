import { COMMON_ERROR_STATUS_MAP, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { ERROR_STATUS_MAP } from "~/orpc/errors";
import { router } from "~/orpc/router";

/*===== RPC Handler =====*/
/**
 * HTTP adapter for the API, mounted at `/rpc/*` (see `app/routes/rpc/`).
 *
 * Only POST is accepted (oRPC's default), so a cross-site navigation can't trigger a procedure with
 * the user's cookies.
 */
export const rpcHandler = new RPCHandler(router, {
  errorStatusMap: { ...COMMON_ERROR_STATUS_MAP, ...ERROR_STATUS_MAP },
  interceptors: [
    // Failures before the procedure runs (e.g. an undecodable body) never reach middleware, so
    // they are logged here.
    onError((error) => console.error("[orpc] handler error", error)),
  ],
});
