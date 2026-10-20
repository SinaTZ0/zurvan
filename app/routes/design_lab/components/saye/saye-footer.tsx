import { CENTER_DESCRIPTOR, CENTER_LINKS, CENTER_PHONE, CENTER_SERVICE_AREA } from "~/lib/contact";
import { Link } from "~/components/link";

import { FOCUS_RING, POSTER_FONT } from "./saye-parts";

/*===== Footer =====*/
// Black sheet, fawn type. The extra bottom padding keeps the floating design switch off the last line.
export function SayeFooter() {
  return (
    <footer className="bg-black px-4 pt-6 pb-28 text-[var(--sy-paper)] sm:px-8 lg:px-12">
      <div className="grid gap-8 border-t-[3px] border-[var(--sy-fawn)] pt-8 md:grid-cols-3">
        <div>
          <p className={`${POSTER_FONT} text-5xl text-[var(--sy-fawn)]`}>زروان</p>
          <p className="mt-2 text-sm">{CENTER_DESCRIPTOR}</p>
        </div>
        <div className="space-y-2">
          <a href={`tel:${CENTER_PHONE.tel}`} className={`${POSTER_FONT} text-3xl text-[var(--sy-fawn)] ${FOCUS_RING}`}>
            <span dir="ltr">{CENTER_PHONE.display}</span>
          </a>
          <p>{CENTER_SERVICE_AREA}</p>
        </div>
        <div className="flex flex-col gap-2">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
            {CENTER_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`hover:text-[var(--sy-fawn)] ${FOCUS_RING}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex gap-5 text-sm">
            <Link to="/privacy" className={`underline underline-offset-4 ${FOCUS_RING}`}>
              حریم خصوصی
            </Link>
            <Link to="/join/partner" className={`underline underline-offset-4 ${FOCUS_RING}`}>
              همکاری با ما
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
