import type { Route } from "./+types/admin-dog-detail";

/*===== Stub =====*/
// Replaced by the Admin's Dog Detail page (F2, F3, F4). Registered early so the other Admin pages can link here.
export const meta: Route.MetaFunction = () => [{ title: "سگ | مدیریت آموزش K9" }];

export default function AdminDogDetailPage() {
  return <h1 className="text-2xl font-extrabold">سگ</h1>;
}
