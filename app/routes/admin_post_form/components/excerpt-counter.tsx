import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import { BLOG_EXCERPT_MAX_LENGTH, BLOG_EXCERPT_MIN_LENGTH } from "~/orpc/blog/validation";
import { FieldHint } from "~/routes/admin_post_form/components/field-parts";

/*===== Excerpt Counter =====*/
/**
 * The excerpt's length against what publishing needs: muted until it reaches the minimum, then a plain «کافیه», and
 * destructive past the maximum. A draft may have less; only the counter says it isn't enough yet.
 */
export function ExcerptCounter({ id, length }: { id: string; length: number }) {
  const short = length < BLOG_EXCERPT_MIN_LENGTH;
  const long = length > BLOG_EXCERPT_MAX_LENGTH;

  return (
    <FieldHint id={id} className={cn("tabular-nums", long && "text-destructive")}>
      <span className={cn(!short && !long && "text-foreground/85")}>
        {formatNumberFa(length)} از {formatNumberFa(BLOG_EXCERPT_MAX_LENGTH)} حرف
      </span>
      {short
        ? `؛ برای انتشار دست‌کم ${formatNumberFa(BLOG_EXCERPT_MIN_LENGTH)} حرف. زیر عنوان و توی نتیجه‌های گوگل دیده می‌شه.`
        : long
          ? "؛ کوتاه‌ترش کن."
          : "؛ برای انتشار کافیه."}
    </FieldHint>
  );
}
