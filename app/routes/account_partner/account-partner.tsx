import { requireSession } from "~/lib/session-guard.server";

import type { Route } from "./+types/account-partner";

/*===== Guard =====*/
// The account layout lets customers in too; the partner's pages are his alone (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["partner"] })];

/*===== Stub =====*/
// Replaced by the Partner Dashboard (F7). Registered early so the partner's landing path and tabs can point here.
export const meta: Route.MetaFunction = () => [{ title: "همکاری من | آموزش K9" }];

export default function AccountPartnerPage() {
  return <h1 className="site-container py-8 text-2xl font-extrabold">همکاری من</h1>;
}
