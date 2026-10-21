import { createFileRoute } from "@tanstack/react-router";

import { authForHeaders } from "~/lib/auth.server";

/*===== Better-Auth Endpoints =====*/
// A server route: Better-Auth answers every `/api/auth/*` request itself.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => authForHeaders(request.headers).handler(request),
      POST: ({ request }) => authForHeaders(request.headers).handler(request),
    },
  },
});
