import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminUser } from "~/orpc/user/contract";
import { describeLastLogin, isRecent } from "~/routes/admin_users/dates";

/*===== User Facts =====*/
/**
 * What the Admin can read but not change. The number and the role sit in the dialog's head; the line under the dates
 * says why neither has an input (one role per phone number, F1).
 */
export function UserFacts({ user }: { user: AdminUser }) {
  return (
    <div className="grid gap-3">
      <dl className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="text-muted-foreground">ثبت‌نام</dt>
        <dd>{formatJalaliTimestamp(user.createdAt)}</dd>

        <dt className="text-muted-foreground">آخرین ورود</dt>
        <dd>
          {user.lastLoginAt === null ? (
            <span className="text-muted-foreground">هنوز وارد نشده</span>
          ) : isRecent({ moment: user.lastLoginAt }) ? (
            <>
              {describeLastLogin({ moment: user.lastLoginAt })}
              <span className="text-muted-foreground">، {formatJalaliTimestamp(user.lastLoginAt)}</span>
            </>
          ) : (
            formatJalaliTimestamp(user.lastLoginAt)
          )}
        </dd>
      </dl>
      <p className="text-xs leading-5 text-pretty text-muted-foreground">
        شماره و نقش عوض نمی‌شن: با همین شماره وارد می‌شه و هر شماره فقط یه نقش داره.
      </p>
    </div>
  );
}
