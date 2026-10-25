import { CircleAlertIcon, XIcon } from "lucide-react";

import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { INK_OUTLINE } from "~/routes/admin_posts/surfaces";

/*===== Field Names =====*/
// What the server names (`publishProblems` in `app/orpc/blog/service.ts`), said the way the form's plates say them.
const FIELD_LABELS: Record<string, string> = {
  excerpt: "خلاصه",
  cover: "عکس",
  coverAlt: "توضیح عکس",
  body: "متن",
  titleEn: "عنوان انگلیسی",
  excerptEn: "خلاصه‌ی انگلیسی",
  coverAltEn: "توضیح انگلیسی عکس",
  bodyEn: "متن انگلیسی",
};

/**
 * One line per message: the server repeats the English all-or-nothing message on every English field that is still
 * blank, so fields with the same message are named together on one line.
 */
function groupProblems(fields: Record<string, string>): { labels: string; message: string }[] {
  const byMessage = new Map<string, string[]>();
  for (const [field, message] of Object.entries(fields)) {
    byMessage.set(message, [...(byMessage.get(message) ?? []), FIELD_LABELS[field] ?? field]);
  }
  return [...byMessage].map(([message, labels]) => ({ labels: labels.join("، "), message }));
}

/*===== Publish Problems =====*/
/**
 * Under a draft whose «انتشار» was refused: what is still missing, in the server's own words, each named by its field,
 * and the way to the form to finish it. It rises in, and stays until she closes it or publishes.
 */
export function PublishProblems({
  postId,
  fields,
  onClose,
}: {
  postId: string;
  fields: Record<string, string>;
  onClose: () => void;
}) {
  const problems = groupProblems(fields);

  return (
    <div
      role="alert"
      className="answer-in relative mx-3 mt-3 rounded-2xl border border-dashed border-destructive/45 px-4 py-3.5 sm:mx-4 xl:mx-5"
    >
      <p className="flex items-center gap-2 pe-10 text-sm font-bold text-destructive">
        <CircleAlertIcon aria-hidden strokeWidth={1.8} className="size-4 shrink-0" />
        هنوز منتشر نمی‌شه؛ این‌ها مونده:
      </p>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm leading-6 text-pretty">
        {problems.map((problem) => (
          <li key={problem.message} className="flex gap-2">
            <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-foreground/50" />
            <span>
              <span className="font-bold">{problem.labels}:</span>{" "}
              <span className="text-foreground/85">{problem.message}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link
        to="/admin/blog/$id/edit"
        params={{ id: postId }}
        className={buttonVariants({ variant: "outline", size: "sm", className: `${INK_OUTLINE} mt-3` })}
      >
        برو تکمیلش کن
      </Link>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="بستن"
        onClick={onClose}
        className="absolute end-1.5 top-1.5 text-muted-foreground hover:text-foreground"
      >
        <XIcon aria-hidden />
      </Button>
    </div>
  );
}
