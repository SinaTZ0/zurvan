import { cn } from "cn";
import { ChevronRightIcon } from "lucide-react";

import { ArticleAuthor } from "~/components/blog/article-author";
import { ArticleClosing } from "~/components/blog/article-closing";
import { PhoneContents, RailContents } from "~/components/blog/article-contents";
import { ArticleHeader } from "~/components/blog/article-header";
import { BLOG_COLUMN } from "~/components/blog/column";
import { PostBody } from "~/components/blog/post-body";
import { stopPreviewLinks } from "~/components/blog/preview-clicks";
import { GroundStrip } from "~/components/ground-strip";
import { Link } from "~/components/link";
import { MascotCut } from "~/components/mascot-cut";
import { bodyHeadings } from "~/lib/blog-body";
import type { BlogPost } from "~/orpc/blog/contract";
import { m } from "~/paraglide/messages";

/*===== Post Article =====*/
// The article template (F16), shared by the public post page and the Admin's preview: the preview builds a `BlogPost`
// from the form's unsaved values, so everything here works for any post (no H2s, no related course, an empty body, a
// `publishedAt` of now). Built like the rules page: the header and the section's stage, the cover, then a sticky rail
// beside the text at a reading measure, and a closing card.

export type PostArticleProps = {
  post: BlogPost;
  /** The Admin's preview: links in the article don't navigate away from the unsaved form. */
  preview?: boolean;
};

/** The contents list needs at least two sections to be worth a list. */
const MIN_CONTENTS = 2;

/**
 * Wide: the rail is the start column (4 of 12): the author's card, then the contents plate, sticky while the text
 * scrolls, then the writing desk at its foot so the column never ends in a hole beside a long text. The text takes the
 * other 8 columns at about 65 characters a line. Phones: the folded contents under the cover, the text, then the author.
 */
export function PostArticle({ post, preview = false }: PostArticleProps) {
  const headings = bodyHeadings(post.body);
  const showContents = headings.length >= MIN_CONTENTS;

  return (
    <article
      aria-labelledby="post-title"
      // The preview guard stops every link click in the capture phase, before the router's links see it.
      onClickCapture={preview ? stopPreviewLinks : undefined}
    >
      <ArticleHeader post={post} />

      {/*===== Cover =====*/}
      <div className={cn(BLOG_COLUMN, "mt-6 lg:mt-8")}>
        <div className="ba-cover overflow-hidden rounded-3xl bg-sunken ring-1 ring-foreground/15 md:rounded-4xl">
          <img
            src={post.cover.urls.hero}
            alt={post.cover.alt}
            width={1920}
            height={823}
            fetchPriority="high"
            decoding="async"
            style={{ backgroundImage: `url("${post.cover.placeholder}")`, backgroundSize: "cover" }}
            className="aspect-[16/10] h-auto w-full object-cover sm:aspect-[1920/823]"
          />
        </div>
      </div>

      {/*===== Rail and Text =====*/}
      <div className={cn(BLOG_COLUMN, "mt-10 grid gap-y-10 lg:mt-14 lg:grid-cols-12 lg:gap-x-12")}>
        {/*------ Rail ------*/}
        <div className="hidden lg:col-span-4 lg:flex lg:flex-col">
          <ArticleAuthor />
          <div className="flex-1">
            {showContents && (
              <div className="sticky top-6">
                <RailContents headings={headings} />
              </div>
            )}
          </div>
          <DeskScene />
        </div>

        {/*------ Text ------*/}
        <div className="min-w-0 lg:col-span-8">
          {showContents && <PhoneContents headings={headings} />}
          <PostBody body={post.body} className={cn(showContents && "max-lg:mt-10")} />

          {/*------ Author on Phones ------*/}
          <ArticleAuthor className="mt-14 lg:hidden" />

          {/*------ Back ------*/}
          <Link
            to="/blog"
            className="mt-10 inline-flex min-h-11 items-center gap-1.5 rounded-sm font-bold text-muted-foreground transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 lg:mt-14"
          >
            <ChevronRightIcon aria-hidden strokeWidth={2} className="size-5 ltr:-scale-x-100" />
            {m.blog_article_back()}
          </Link>
        </div>
      </div>

      {/*===== Closing =====*/}
      {/* Room above the card for the dog sitting on its edge, his bubble and the sky. */}
      <div className={cn(BLOG_COLUMN, "mt-44 lg:mt-52")}>
        <ArticleClosing relatedCourse={post.relatedCourse} />
      </div>

      {/* Motion, all off for reduced motion (which shows the finished page):
          - load, the page's one moment: the section's dog rises from behind the path (the clip moves with him, so
            nothing shows below the path until he is up), then his bubble pops from its tail and the cover settles in;
          - the closing dog rises from behind the card's edge as it scrolls into view, where the browser can. */}
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .ba-dog {
            animation: ba-rise .8s cubic-bezier(.2,.8,.25,1) .15s both;
          }
          .ba-pop {
            transform-origin: 2.75rem 100%;
            animation: answer-pop .38s cubic-bezier(.3,1.45,.5,1) .8s both;
          }
          :dir(rtl) .ba-pop, .ba-pop:dir(rtl) {
            transform-origin: calc(100% - 2.75rem) 100%;
          }
          .ba-cover {
            animation: answer-in .6s cubic-bezier(.2,.8,.2,1) .35s both;
          }
          @supports (animation-timeline: view()) {
            .ba-edge {
              animation: ba-rise linear both;
              animation-timeline: view();
              animation-range: entry 10% entry 70%;
            }
          }
        }
        @keyframes ba-rise {
          0% { transform: translateY(70%); clip-path: inset(-30% -30% 100% -30%); }
          80% { transform: translateY(-3%); clip-path: inset(-30% -30% 0 -30%); }
          100% { transform: none; clip-path: inset(-30% -30% -10% -30%); }
        }
      `}</style>
    </article>
  );
}

/*===== Desk Scene =====*/
/**
 * The foot of the rail, under the plate that stays sticky above it: the writing desk with its quill, where the posts
 * are written, between two bushes on a strip of path. Wide screens only, like the rail.
 */
function DeskScene() {
  return (
    <div aria-hidden className="pointer-events-none relative mt-12 h-64">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_55%_at_50%_75%,rgb(255_194_26/0.08),transparent)]" />
      <MascotCut name="desk" className="absolute inset-x-0 bottom-[1.2rem] mx-auto w-[56%] translate-y-[6%]" />
      <GroundStrip className="absolute inset-x-0 bottom-0 h-9 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]" />
      <MascotCut name="plants" className="lively-sway absolute start-[2%] bottom-[1.2rem] w-[17%] translate-y-[6%]" />
      <MascotCut
        name="plants"
        className="lively-sway-2 absolute end-[2%] bottom-[1.2rem] w-[14%] translate-y-[6%] -scale-x-100"
      />
    </div>
  );
}
