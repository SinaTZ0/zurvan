import { DoodleWalk } from "~/components/doodles";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";

/*===== Requests Empty =====*/
/** No request ever: one panel that offers the first one, with the page's gold-leaf button. */
export function RequestsEmpty() {
  return (
    <section
      aria-labelledby="requests-empty-title"
      className="flex flex-col items-center rounded-3xl bg-sunken px-6 py-12 text-center lg:py-16"
    >
      <DoodleWalk className="h-24 w-auto" />

      <h2 id="requests-empty-title" className="mt-6 text-xl font-extrabold text-balance">
        هنوز مشکلی نفرستاده‌ای
      </h2>
      <p className="mt-2 max-w-md text-balance text-muted-foreground">ویدیوی کوتاهی از رفتار سگت کافی است.</p>

      <Link to="/behavior-modification" className={buttonVariants({ size: "lg", className: "mt-8 w-full sm:w-auto" })}>
        درخواست بفرست
      </Link>
    </section>
  );
}
