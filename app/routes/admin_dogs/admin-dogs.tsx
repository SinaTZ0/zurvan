import type { Route } from "./+types/admin-dogs";

/*===== Stub =====*/
// Replaced by the Dogs page (F2). Registered early so the nav and the other pages can link here.
export const meta: Route.MetaFunction = () => [{ title: "سگ‌ها | مدیریت آموزش K9" }];

export default function AdminDogsPage() {
  return <h1 className="text-2xl font-extrabold">سگ‌ها</h1>;
}
