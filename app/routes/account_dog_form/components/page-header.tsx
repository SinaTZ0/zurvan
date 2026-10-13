import { ChevronRightIcon } from "lucide-react";

import { Link } from "~/components/link";

/*===== Page Header =====*/
/**
 * The form's heading, in the dog's voice (docs/storefront-design.md): the back link, the `h1` and one muted line.
 * Editing goes back to the dog's own page, adding goes back to the list. The chalk doodle belongs to the dog card, not
 * here, so the page has one.
 */
export function PageHeader({ dog }: { dog: { id: string; name: string } | null }) {
  return (
    <header>
      <Link
        to={dog ? `/account/dogs/${dog.id}` : "/account"}
        className="-ms-1 inline-flex items-center gap-1 rounded-sm px-1 text-sm font-bold text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ChevronRightIcon aria-hidden className="size-4" />
        {/* A dog's name can be Latin; `bdi` keeps it from flipping the sentence around it. */}
        {dog ? <bdi>{dog.name}</bdi> : "سگ‌های من"}
      </Link>

      <h1 className="mt-4 font-display text-h1 font-black text-balance">
        {dog ? "مشخصاتمو درست کن" : "بذار خودمو معرفی کنم"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        {dog
          ? "هر چی عوض شده، همین‌جا بنویس."
          : "چند دقیقه بیشتر طول نمی‌کشه. هر چی دقیق نمی‌دونی، تقریبی بنویس؛ بعداً هم می‌شه عوضش کرد."}
      </p>
    </header>
  );
}
