import { cn } from "cn";

import type { BlogCard } from "~/orpc/blog/contract";
import { AskTile } from "~/routes/blog_index/components/ask-tile";
import { LeadCard } from "~/routes/blog_index/components/lead-card";
import { PostCard } from "~/routes/blog_index/components/post-card";

/*===== Ask Tile Spans =====*/
// The ask tile takes whatever the last row of cards leaves, so no cell is ever empty: on laptops (three columns) one
// or two cells beside the last cards, or a whole row; on tablets (two columns) one cell or a row. Phones list one card
// a row, so it is a row there too. Tailwind needs the class names whole.
const LG_SPAN = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3" } as const;
const MD_SPAN = { 1: "md:col-span-1", 2: "md:col-span-2" } as const;

function askSpans(rest: number) {
  const lg = (rest % 3 === 0 ? 3 : 3 - (rest % 3)) as 1 | 2 | 3;
  const md = (rest % 2 === 0 ? 2 : 1) as 1 | 2;
  return cn(LG_SPAN[lg], MD_SPAN[md]);
}

/** The stagger of a list that arrives after a change: 60ms a card, capped so a long list doesn't keep coming. */
function delay(index: number): React.CSSProperties {
  return { "--answer-delay": `${Math.min(index, 4) * 60}ms` } as React.CSSProperties;
}

/*===== Post Grid =====*/
/**
 * The posts, newest first: the newest as the lead card, the rest as cards, and the ask tile closing the last row. With
 * one post it is the lead and the ask under it, so the page still reads whole (the English site may have a single post).
 * `arrive`: the list is new after a change of section or search, so its parts rise in one after another.
 */
export function PostGrid({ posts, arrive }: { posts: BlogCard[]; arrive: boolean }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className={cn(arrive && "answer-in")}>
        <LeadCard post={lead} newest={rest.length > 0} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {rest.map((post, index) => (
          <div key={post.slug} className={cn(arrive && "answer-in")} style={arrive ? delay(index + 1) : undefined}>
            <PostCard post={post} />
          </div>
        ))}
        <AskTile
          className={cn(askSpans(rest.length), arrive && "answer-in")}
          style={arrive ? delay(rest.length + 1) : undefined}
        />
      </div>
    </div>
  );
}
