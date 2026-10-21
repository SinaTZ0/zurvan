import { cn } from "cn";

import { toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { SMS_KIND_LABELS } from "~/orpc/sms/constants";
import type { SmsMessage } from "~/orpc/sms/contract";
import { SmsBody } from "~/routes/admin_sms/components/sms-body";
import { formatClock } from "~/routes/admin_sms/dates";

/*===== Phone =====*/
/** `09123456789` as «۰۹۱۲ ۳۴۵ ۶۷۸۹», easier to read off a row; any other shape is shown as it is. */
function formatPhone(phoneNumber: string): string {
  const grouped = /^09\d{9}$/.test(phoneNumber)
    ? `${phoneNumber.slice(0, 4)} ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`
    : phoneNumber;
  return toPersianDigits(grouped);
}

/*===== SMS Message Row =====*/
/**
 * One message in the thread list, laid out like the phone that would have received it: who it went to (the number,
 * bold), what kind it is (an ink chip), the time, and the body in a `bg-muted` bubble whose tail corner points back at
 * the number. Never the dog's chalk bubble: the dog doesn't speak in the Admin area. Reading only, so the number is not
 * a `tel:` link.
 *
 * One element serves every width, in grid areas so the reading order stays the same:
 * - **Phones:** the number, the chip and the time on one line, the bubble under them.
 * - **`md` to `xl`:** the number and the time over the chip in a narrow column, the bubble beside them.
 * - **From `xl`:** one line in fixed tracks (number, chip, time, bubble), so he reads down each column. The bubble hugs
 *   its text up to about 40rem, as on a phone.
 *
 * The meta sits on the bubble's first line (`items-baseline`), not on its box.
 */
export function SmsMessageRow({
  message,
  appOrigin,
  showKind,
  rise,
}: {
  message: SmsMessage;
  appOrigin: string;
  /**
   * False under a kind filter, where every chip would repeat the selected pill: the chip and its track go, so the time
   * moves up beside the number. Every row of a view is the same, so the columns still line up.
   */
  showKind: boolean;
  /** The row's delay (seconds) in a list that just arrived under a new kind or page, or null when it didn't. */
  rise: number | null;
}) {
  const { phoneNumber, kind, body, createdAt } = message;

  return (
    <li
      style={rise !== null ? ({ "--answer-delay": `${rise}s` } as React.CSSProperties) : undefined}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-2 px-4 py-3 sm:px-5",
        "[grid-template-areas:'number_kind_time'_'bubble_bubble_bubble']",
        "md:grid-cols-[9.5rem_minmax(0,1fr)] md:items-baseline md:gap-x-5 md:gap-y-1 md:[grid-template-areas:'number_bubble'_'kind_bubble']",
        "xl:gap-x-4 xl:px-6",
        showKind
          ? "xl:grid-cols-[8rem_10.5rem_2.75rem_minmax(0,40rem)] xl:[grid-template-areas:'number_kind_time_bubble']"
          : "xl:grid-cols-[8rem_2.75rem_minmax(0,40rem)] xl:[grid-template-areas:'number_time_bubble']",
        rise !== null && "answer-in",
      )}
    >
      {/*------ Number and Time ------*/}
      {/* From `md` to `xl` the time shares the number's line, at its end; elsewhere it has its own track. */}
      <p className="flex min-w-0 items-baseline justify-between gap-2 [grid-area:number] xl:block">
        <bdi dir="ltr" className="text-sm font-bold whitespace-nowrap tabular-nums">
          {formatPhone(phoneNumber)}
        </bdi>
        <MessageTime createdAt={createdAt} className="hidden md:inline xl:hidden" />
      </p>

      {/*------ Kind ------*/}
      <p className={cn("min-w-0 [grid-area:kind]", !showKind && "hidden")}>
        <span className="inline-block max-w-full truncate rounded-full border border-foreground/15 px-2.5 py-0.5 align-baseline text-xs text-muted-foreground md:overflow-visible">
          {SMS_KIND_LABELS[kind]}
        </span>
      </p>

      <MessageTime createdAt={createdAt} className="[grid-area:time] md:hidden xl:block" />

      {/*------ Bubble ------*/}
      <p className="w-fit max-w-full rounded-2xl rounded-ss-sm bg-muted px-3.5 py-2 text-sm leading-7 [overflow-wrap:anywhere] whitespace-pre-line text-foreground [grid-area:bubble]">
        <SmsBody body={body} appOrigin={appOrigin} />
      </p>
    </li>
  );
}

/*===== Message Time =====*/
/** «۱۴:۳۲»; the full date is the day label's, and the title's for a hover. */
function MessageTime({ createdAt, className }: { createdAt: Date; className?: string }) {
  const clock = formatClock(createdAt);

  return (
    <time
      dateTime={createdAt.toISOString()}
      title={`${formatJalaliTimestamp(createdAt)}، ${clock}`}
      dir="ltr"
      className={cn("text-xs whitespace-nowrap text-muted-foreground tabular-nums", className)}
    >
      {clock}
    </time>
  );
}
