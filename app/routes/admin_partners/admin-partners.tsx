import type { Route } from "./+types/admin-partners";

/*===== Stub =====*/
// Replaced by Partners and Leads (F7). Registered early so the nav and the Dashboard can link here.
export const meta: Route.MetaFunction = () => [{ title: "همکاران | مدیریت آموزش K9" }];

export default function AdminPartnersPage() {
  return <h1 className="text-2xl font-extrabold">همکاران</h1>;
}
