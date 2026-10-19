import { Link } from "~/components/link";

/*===== Contents Rail =====*/
/**
 * Anchors to the sections, beside them on desktop. It is hidden on phones, where the short sections are simply
 * stacked, so the rail never takes width the list needs.
 */
const SECTIONS = [
  { id: "kept", label: "چی ذخیره می‌شه" },
  { id: "who-sees", label: "کی چی رو می‌بینه" },
  { id: "yours", label: "چی رو خودت عوض می‌کنی" },
  { id: "technical", label: "جزئیات فنی" },
] as const;

export function ContentsRail() {
  return (
    <nav aria-label="فهرست صفحه" className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
      <ul className="space-y-1 border-s border-border ps-5">
        {SECTIONS.map(({ id, label }) => (
          <li key={id}>
            <Link
              to={`#${id}`}
              className="block rounded-sm py-1.5 font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
