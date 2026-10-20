import { Link } from "~/components/link";
import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";

/*===== Footer =====*/
export function RakhshFooter() {
  const linkClass =
    "rounded underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rk-sand)]";
  return (
    <footer className="border-t border-[var(--rk-sand)]/25 bg-[var(--rk-olive-deep)] px-4 pt-12 pb-28 text-[var(--rk-bone)]/85 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:justify-between">
        <div>
          <p className="font-display text-2xl font-black text-[var(--rk-bone)]">زروان</p>
          <p className="mt-1 text-sm text-[var(--rk-sand)]">{CENTER_DESCRIPTOR}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            تلفن:{" "}
            <a href={`tel:${CENTER_PHONE.tel}`} dir="ltr" className={`inline-block ${linkClass}`}>
              {CENTER_PHONE.display}
            </a>
          </p>
          <p>محدوده‌ی خدمات: {CENTER_SERVICE_AREA}</p>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:flex-col md:gap-y-2">
          {CENTER_LINKS.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={linkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm md:flex-col">
          <li>
            <Link to="/privacy" className={linkClass}>
              حریم خصوصی
            </Link>
          </li>
          <li>
            <Link to="/join/partner" className={linkClass}>
              همکاری با ما
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
