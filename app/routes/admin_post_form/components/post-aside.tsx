import { cn } from "cn";
import { ArrowUpLeftIcon, CircleAlertIcon, EyeIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button } from "~/components/ui/button";
import { ADMIN_HAIRLINE, ADMIN_PLATE, ADMIN_TEAR } from "~/lib/admin-plate";
import { readingMinutes } from "~/lib/blog-body";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminBlogPost } from "~/orpc/blog/contract";
import { POST_FORM_SECTIONS, type PostFormSectionId, sectionAnchor } from "~/routes/admin_post_form/sections";
import { INK_OUTLINE } from "~/routes/admin_post_form/surfaces";

/*===== Post Aside =====*/
/**
 * The column beside the form (under it on phones): from `xl` a small contents list that jumps to each plate and marks
 * the ones with a message, then the plate «این نوشته» with what the form itself doesn't show: where the post stands,
 * its address (a link once it is public), its length and reading time as she types, the English page, and the old
 * addresses that still lead here. «پیش‌نمایش» closes the plate.
 */
export function PostAside({
  post,
  slug,
  wordCount,
  englishWritten,
  invalidSections,
  onPreview,
}: {
  post: AdminBlogPost | null;
  /** The address as typed. */
  slug: string;
  wordCount: number;
  /** How many of the four English parts are written. */
  englishWritten: number;
  invalidSections: ReadonlySet<PostFormSectionId>;
  onPreview: () => void;
}) {
  const published = post?.status === "published";

  return (
    <div className="flex min-w-0 flex-col gap-5">
      {/*===== Contents =====*/}
      {/* Only beside the form: on phones the plates are right there, one after another. */}
      <nav aria-label="بخش‌های فرم" className="hidden xl:block">
        <ul className="grid grid-cols-2 gap-x-3">
          {POST_FORM_SECTIONS.map((section) => {
            const invalid = invalidSections.has(section.id);
            return (
              <li key={section.id}>
                <Link
                  to="."
                  hash={sectionAnchor(section.id)}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    invalid
                      ? "font-bold text-destructive"
                      : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                  )}
                >
                  {invalid && (
                    <CircleAlertIcon
                      aria-hidden
                      strokeWidth={1.8}
                      className="answer-pop size-3.5 shrink-0 [--pop-origin:50%_50%]"
                    />
                  )}
                  <span className="truncate">{section.title}</span>
                  {invalid && <span className="sr-only">، پیام داره</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/*===== This Post =====*/}
      <aside aria-labelledby="post-aside-title" className={cn(ADMIN_PLATE, "min-w-0 p-4 sm:p-5")}>
        <h2 id="post-aside-title" className={cn(DISPLAY_HEADING, "text-xl")}>
          این نوشته
        </h2>

        <dl className={cn("mt-3 divide-y text-sm", ADMIN_HAIRLINE)}>
          <Fact label="وضعیت">
            {published && post.publishedAt ? (
              <>منتشرشده از {formatJalaliTimestamp(post.publishedAt)}</>
            ) : post ? (
              "پیش‌نویس"
            ) : (
              "هنوز ذخیره نشده"
            )}
          </Fact>
          <Fact label="نشانی">
            {published && post ? (
              // A new tab: the form keeps what she has typed while she looks at the live page.
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
              >
                <bdi dir="ltr" className="break-all">
                  /blog/{post.slug}
                </bdi>
                <ArrowUpLeftIcon aria-hidden className="size-3.5 shrink-0" />
                <span className="sr-only">(توی برگه‌ی تازه)</span>
              </Link>
            ) : slug ? (
              <bdi dir="ltr" className="break-all">
                /blog/{slug}
              </bdi>
            ) : (
              <span className="text-muted-foreground">هنوز نداره</span>
            )}
          </Fact>
          <Fact label="طول">
            {wordCount > 0 ? (
              <>
                {formatNumberFa(wordCount)} کلمه، حدود {formatNumberFa(readingMinutes(wordCount))} دقیقه
              </>
            ) : (
              <span className="text-muted-foreground">هنوز متن نداره</span>
            )}
          </Fact>
          <Fact label="انگلیسی">
            {englishWritten === 4 ? (
              "کامل"
            ) : englishWritten === 0 ? (
              <span className="text-muted-foreground">نداره</span>
            ) : (
              `${formatNumberFa(englishWritten)} از ۴ بخش`
            )}
          </Fact>
        </dl>

        {/*------ Old Addresses ------*/}
        {post && post.previousSlugs.length > 0 && (
          <div className={cn("mt-1 border-t pt-3", ADMIN_TEAR)}>
            <p className="text-xs text-muted-foreground">نشانی‌های قبلی که به این‌جا می‌رسن</p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm text-foreground/85">
              {post.previousSlugs.map((old) => (
                <li key={old}>
                  <bdi dir="ltr" className="break-all">
                    /blog/{old}
                  </bdi>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button type="button" variant="outline" onClick={onPreview} className={cn(INK_OUTLINE, "mt-4 h-11 w-full")}>
          <EyeIcon aria-hidden strokeWidth={1.8} />
          پیش‌نمایش
        </Button>
      </aside>
    </div>
  );
}

/*===== Fact =====*/
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end text-foreground/90">{children}</dd>
    </div>
  );
}
