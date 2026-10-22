import { createFileRoute } from "@tanstack/react-router";

import { rpcHandler } from "~/orpc/handler.server";
import { localeFromHeaders } from "~/orpc/locale";

/*===== RPC Endpoint =====*/
/** Hands the request to oRPC. Anything that isn't a known procedure is a 404. */
async function handleRequest(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    // Must match this route's path and the browser link's `url` (`~/orpc/client`).
    prefix: "/rpc",
    context: { headers: request.headers, locale: localeFromHeaders(request.headers) },
  });
  return response ?? new Response("Not found", { status: 404 });
}

// Every method goes to oRPC, which answers the ones it doesn't take with a proper oRPC response.
export const Route = createFileRoute("/rpc/$")({
  server: { handlers: { ANY: ({ request }) => handleRequest(request) } },
});
