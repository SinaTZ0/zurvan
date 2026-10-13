import { toPersianDigits } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminUser } from "~/orpc/user/contract";
import { ROLE_WORDS } from "~/routes/admin_users/components/user-chips";

/*===== User Facts =====*/
/**
 * What the Admin can read but not change: the number and the role are fixed (one role per phone number, F1), so the
 * dialog says why instead of showing a disabled input.
 */
export function UserFacts({ user }: { user: AdminUser }) {
  return (
    <dl className="grid gap-3 text-sm">
      <Fact term="شماره‌ی موبایل" note="با همین شماره وارد می‌شود، پس عوض نمی‌شود.">
        {user.phoneNumber === null ? (
          <span className="text-muted-foreground">بدون شماره</span>
        ) : (
          <bdi dir="ltr" className="font-bold tabular-nums">
            {toPersianDigits(user.phoneNumber)}
          </bdi>
        )}
      </Fact>
      <Fact term="نقش" note="هر شماره یک نقش دارد؛ نقش عوض نمی‌شود.">
        <span className="font-bold">{ROLE_WORDS[user.role]}</span>
      </Fact>
      <Fact term="ثبت‌نام">{formatJalaliTimestamp(user.createdAt)}</Fact>
      <Fact term="آخرین ورود">
        {user.lastLoginAt ? (
          formatJalaliTimestamp(user.lastLoginAt)
        ) : (
          <span className="text-muted-foreground">هنوز وارد نشده</span>
        )}
      </Fact>
    </dl>
  );
}

/*===== Fact =====*/
function Fact({ term, note, children }: { term: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-0.5">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>
        {children}
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </dd>
    </div>
  );
}
