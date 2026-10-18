import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { createServerClient } from "~/orpc/server-client.server";
import {
  COMMISSION_PERCENT_KEY,
  DEPOSIT_PERCENT_KEY,
  OTP_PER_IP_KEY,
  OTP_PER_PHONE_KEY,
} from "~/orpc/setting/constants";
import { SettingCard } from "~/routes/admin_settings/components/setting-card";
import { SettingGroup } from "~/routes/admin_settings/components/setting-group";

import type { Route } from "./+types/admin-settings";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "تنظیمات | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. The three settings come in the API's fixed order, each with its default, bounds and the
// time of its last change. No URL state.
export async function loader({ request }: Route.LoaderArgs) {
  const settings = await createServerClient(request).setting.admin.get();

  return { settings };
}

/*===== Admin Settings =====*/
/**
 * F10 for the Admin: the partners' commission percent, the deposit taken when a customer pays, and how many sign-in
 * codes one phone or one connection may ask for in an hour. A saved number is read by the next request, so nothing here needs a restart.
 */
export default function AdminSettings({ loaderData }: Route.ComponentProps) {
  const { settings } = loaderData;
  const find = (key: string) => settings.find((setting) => setting.key === key);
  const commission = find(COMMISSION_PERCENT_KEY);
  const deposit = find(DEPOSIT_PERCENT_KEY);
  const perPhone = find(OTP_PER_PHONE_KEY);
  const perIp = find(OTP_PER_IP_KEY);

  /*------ Busy ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader title="تنظیمات" summary="این‌ها بدون راه‌اندازی دوباره اجرا می‌شوند." />

      <div className="flex flex-col gap-10">
        {/*===== Commission =====*/}
        {commission && (
          <SettingGroup title="پورسانت همکاران">
            <SettingCard setting={commission} busy={busy} />
          </SettingGroup>
        )}

        {/*===== Deposit =====*/}
        {deposit && (
          <SettingGroup title="پیش‌پرداخت">
            <SettingCard setting={deposit} busy={busy} />
          </SettingGroup>
        )}

        {/*===== Sign-in Codes =====*/}
        {perPhone && perIp && (
          <SettingGroup title="کد ورود پیامکی">
            <SettingCard setting={perPhone} busy={busy} />
            <SettingCard setting={perIp} busy={busy} />
            <p className="max-w-xl text-sm text-pretty text-muted-foreground">
              طول کد (۵ رقم)، اعتبار ۲ دقیقه، ۵ بار اشتباه و ۶۰ ثانیه انتظار بین دو کد ثابت‌اند و از اینجا عوض نمی‌شوند.
            </p>
          </SettingGroup>
        )}
      </div>
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-settings-error-title">
      <h1 id="admin-settings-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "تنظیمات باز نشد"}
      </h1>
      <p className="mt-3 max-w-xl text-pretty text-muted-foreground">
        مشکلی پیش آمد. صفحه را دوباره باز کن یا چند دقیقه‌ی دیگر سر بزن.
      </p>
      <Link to="/admin" className={buttonVariants({ size: "lg", className: "mt-6" })}>
        برگرد به مدیریت
      </Link>
    </section>
  );
}
