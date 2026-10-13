import { SMS_KIND_LABELS, type SmsKind } from "~/orpc/sms/constants";
import { toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";

/*===== Types =====*/
export type SmsMessageRowProps = {
  phoneNumber: string;
  kind: SmsKind;
  body: string;
  createdAt: Date;
};

/*===== SMS Message Row =====*/
/**
 * One message laid out like the screen of the phone that would have received it: the number and time, the kind as a
 * quiet chip, and the body in a bubble. Reading only, so the number is not a `tel:` link. The body never takes the
 * chalk `font-hand`: the dog doesn't speak on this page.
 */
export function SmsMessageRow({ phoneNumber, kind, body, createdAt }: SmsMessageRowProps) {
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 md:grid md:grid-cols-[16rem_minmax(0,1fr)] md:gap-6">
      {/*------ Number, Kind and Time ------*/}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <bdi dir="ltr" className="font-extrabold tabular-nums">
            {toPersianDigits(phoneNumber)}
          </bdi>
          <time dateTime={createdAt.toISOString()} className="text-xs text-muted-foreground tabular-nums">
            {formatJalaliTimestamp(createdAt)}
          </time>
        </div>
        <span className="w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          {SMS_KIND_LABELS[kind]}
        </span>
      </div>

      {/*------ Body ------*/}
      <p className="max-w-prose rounded-2xl rounded-ss-sm bg-muted px-4 py-3 text-sm leading-7 whitespace-pre-line text-foreground">
        {body}
      </p>
    </li>
  );
}
