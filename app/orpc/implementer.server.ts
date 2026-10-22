import { implement } from "@orpc/server";

import { contract } from "~/orpc/contract";
import type { Locale } from "~/paraglide/runtime";
import { handleErrorsMiddleware } from "~/orpc/middleware/handle-errors/handle-errors.middleware";

/*===== Implementer =====*/
// Undecorated: only assembles the router (`router.ts`). Declares the initial context every
// caller (RPC handler, server client) must provide: the request's headers, and the language its sentences are worded
// in (`~/orpc/locale`).
export const implementer = implement(contract).$context<{ headers: Headers; locale: Locale }>();

/*===== Base =====*/
// Every procedure is built from `base`, so global middleware wraps contract validation exactly
// once. Never assemble the router from `base`: v2 doesn't dedupe, so it would run twice.
export const base = implementer.use(handleErrorsMiddleware);
