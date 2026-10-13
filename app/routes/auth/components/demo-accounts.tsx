import { DEMO_ACCOUNTS } from "~/lib/demo-accounts";
import { toPersianDigits } from "~/lib/digits";
import { SHOWCASE_SIGN_IN_CODE, USER_ROLE_LABELS } from "~/lib/user-constants";

/*===== Demo Accounts =====*/
/**
 * Showcase mode only: one account per role, so the owner can switch roles while showing the site. Picking one fills
 * the phone field; the code step then takes the showcase code. Numbers are shown in Latin digits, as typed.
 */
export function DemoAccounts({ onPick }: { onPick: (phoneNumber: string) => void }) {
  return (
    <section
      aria-labelledby="demo-accounts-title"
      className="rounded-3xl border border-dashed border-primary/35 bg-card p-4"
    >
      <h2 id="demo-accounts-title" className="text-sm font-bold">
        حساب‌های نمایشی
      </h2>
      <p className="mt-1 text-xs text-pretty text-muted-foreground">
        یکی را انتخاب کن. کد ورود همه {toPersianDigits(SHOWCASE_SIGN_IN_CODE)} است.
      </p>
      <ul className="mt-3 divide-y divide-border">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.phoneNumber}>
            <button
              type="button"
              onClick={() => onPick(account.phoneNumber)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-start transition-colors hover:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="min-w-0">
                <span className="block text-sm font-bold">
                  {account.firstName} {account.lastName}
                  <span className="ms-2 text-xs font-normal text-primary">{USER_ROLE_LABELS[account.role]}</span>
                </span>
                <span className="block truncate text-xs text-muted-foreground">{account.note}</span>
              </span>
              <span dir="ltr" className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {account.phoneNumber}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
