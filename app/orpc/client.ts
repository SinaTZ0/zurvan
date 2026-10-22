import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterContractClient } from "@orpc/contract";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import type { contract } from "~/orpc/contract";
import { LOCALE_HEADER } from "~/orpc/locale";
import { router } from "~/orpc/router";
import { getLocale } from "~/paraglide/runtime";

/*===== Client =====*/
// One client for loaders and components (docs/orpc.md). On the server it calls procedures in-process: handler plugins
// and status codes don't apply, and errors arrive as `ORPCError`. That instance is shared by every request, so the
// request's headers come through the context function, never module state. In the browser it is an HTTP client typed
// from the contract; Start's build drops the server branch, and `router` with it. Both carry the page's language
// (`~/orpc/locale`): on the server it is the request's, set by Paraglide's middleware (`app/server.ts`).
const getClient = createIsomorphicFn()
  .server((): RouterContractClient<typeof contract> =>
    createRouterClient(router, {
      context: () => ({ headers: new Headers(getRequestHeaders()), locale: getLocale() }),
    }),
  )
  // The link resolves `/rpc` against the current origin; it must match the server route (`app/routes/rpc/`).
  .client(
    (): RouterContractClient<typeof contract> =>
      createORPCClient(new RPCLink({ url: "/rpc", headers: () => ({ [LOCALE_HEADER]: getLocale() }) })),
  );

export const client = getClient();

/*===== TanStack Query =====*/
/** Query and mutation option builders for every procedure, e.g. `orpc.dog.list.queryOptions()`. */
export const orpc = createTanstackQueryUtils(client);
