import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";

import { Link } from "~/components/link";
import { DISPLAY_HEADING } from "~/lib/display-heading";

/*===== Page Header =====*/
/**
 * The form's heading: the way back (the dog's own page when editing, the list when adding), a gold-outlined chip that
 * says which of the two this is, the `h1` (the dog's name in gold when editing) and one muted line.
 */
export function PageHeader({ dog }: { dog: { id: string; name: string } | null }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          to={dog ? `/account/dogs/${dog.id}` : "/account"}
          className="-ms-1 inline-flex items-center gap-1 rounded-sm px-1 text-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChevronRightIcon aria-hidden className="size-4" />
          {/* A dog's name can be Latin; `bdi` keeps it from flipping the sentence around it. */}
          {dog ? <bdi>{dog.name}</bdi> : "سگ‌های من"}
        </Link>
        <span className="rounded-full border border-primary/60 px-3 py-1 text-xs font-bold text-primary">
          {dog ? "ویرایش" : "سگ تازه"}
        </span>
      </div>

      <h1 className={cn(DISPLAY_HEADING, "mt-5 text-h1 text-balance")}>
        {dog ? (
          <>
            مشخصات <bdi className="text-primary">{dog.name}</bdi>
          </>
        ) : (
          "سگت رو معرفی کن"
        )}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground sm:text-lg">
        {dog
          ? "هر چی عوض شده، همین‌جا بنویس."
          : "چند دقیقه بیشتر طول نمی‌کشه. هر چی رو دقیق نمی‌دونی، تقریبی بنویس؛ بعداً هم می‌شه عوضش کرد."}
      </p>
    </header>
  );
}
