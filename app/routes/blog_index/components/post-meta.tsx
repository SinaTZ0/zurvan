import { CalendarDaysIcon, ClockIcon } from "lucide-react";

import { formatNumber, formatTimestamp } from "~/lib/locale-format";
import type { BlogCard } from "~/orpc/blog/contract";
import { m } from "~/paraglide/messages";

/*===== Post Meta =====*/
/** A card's quiet foot: the day it was published (in the page's calendar) and how long it takes to read. */
export function PostMeta({ post }: { post: Pick<BlogCard, "publishedAt" | "readingMinutes"> }) {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground sm:text-sm">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDaysIcon aria-hidden strokeWidth={1.7} className="size-4 text-primary/80" />
        <time dateTime={post.publishedAt.toISOString()}>{formatTimestamp(post.publishedAt)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ClockIcon aria-hidden strokeWidth={1.7} className="size-4 text-primary/80" />
        {m.blog_reading_minutes({ count: formatNumber(post.readingMinutes) })}
      </span>
    </p>
  );
}
