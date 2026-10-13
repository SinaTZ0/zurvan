import { requireSession } from "~/lib/session-guard.server";

import type { Route } from "./+types/account-partner-leads";

/*===== Guard =====*/
// The account layout lets customers in too; the partner's pages are his alone (docs/app-spec.md, Pages).
export const middleware: Route.MiddlewareFunction[] = [requireSession({ roles: ["partner"] })];

/*===== Stub =====*/
// Replaced by Leads and Customers (F7). Registered early so the partner's tabs can point here.
export const meta: Route.MetaFunction = () => [{ title: "شماره‌ها و مشتری‌ها | آموزش K9" }];

export default function AccountPartnerLeadsPage() {
  return <h1 className="site-container py-8 text-2xl font-extrabold">شماره‌ها و مشتری‌ها</h1>;
}
