import { createFileRoute } from "@tanstack/react-router";
import { LockIcon } from "lucide-react";
import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { createServerClient } from "~/orpc/server-client.server";
import {
  COMMISSION_PERCENT_KEY,
  DEPOSIT_PERCENT_KEY,
  OTP_PER_IP_KEY,
  OTP_PER_PHONE_KEY,
} from "~/orpc/setting/constants";
import { SettingGroup } from "~/routes/admin_settings/components/setting-group";
import { SettingPlate } from "~/routes/admin_settings/components/setting-plate";
import { SettingsMotion } from "~/routes/admin_settings/components/settings-motion";

import type { Route } from "./+types/admin-settings";

/*===== Constants =====*/
/** The ink outline (Batch 2 and 3's) for the error page's way back. */
const INK_OUTLINE =
  "border-foreground/15 bg-transparent hover:bg-foreground/5 dark:border-foreground/15 dark:bg-transparent";

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "تنظیمات | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. The four settings come in the API's fixed order, each with its default, bounds and the
// time of its last change. No URL state.
export async function loader({ request }: Route.LoaderArgs) {
  const settings = await createServerClient(request).setting.admin.get();

  return { settings };
}

/*===== Admin Settings =====*/
/**
 * F10 for the Admin: the partners' commission percent, the deposit taken when a customer pays, and how many sign-in
 * codes one phone or one connection may ask for in an hour. A saved number is read by the next request, so nothing here
 * needs a restart. Each setting is its own plate with its own «ذخیره».
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
      <SettingsMotion />

      {/*===== Header =====*/}
      <AdminPageHeader title="تنظیمات" summary="این‌ها بدون راه‌اندازی دوباره اجرا می‌شن." />

      <div className="flex flex-col gap-8 lg:gap-10">
        {/*===== Commission =====*/}
        {commission && (
          <SettingGroup title="پورسانت همکاران">
            <SettingPlate setting={commission} busy={busy} />
          </SettingGroup>
        )}

        {/*===== Deposit =====*/}
        {deposit && (
          <SettingGroup title="پیش‌پرداخت">
            <SettingPlate setting={deposit} busy={busy} />
          </SettingGroup>
        )}

        {/*===== Sign-in Codes =====*/}
        {perPhone && perIp && (
          <SettingGroup title="کد ورود پیامکی">
            <SettingPlate setting={perPhone} busy={busy} />
            <SettingPlate setting={perIp} busy={busy} />

            {/*------ Fixed Rules ------*/}
            {/* What he might look for here and won't find: a dashed plate, the same vocabulary as an empty state. */}
            <div className={`flex items-start gap-3 rounded-3xl border px-5 py-4 lg:px-6 ${ADMIN_TEAR}`}>
              <LockIcon aria-hidden strokeWidth={1.7} className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-pretty text-muted-foreground">
                طول کد (۵ رقم)، اعتبار ۲ دقیقه، ۵ بار اشتباه و ۶۰ ثانیه انتظار بین دو کد ثابتن و از اینجا عوض نمی‌شن.
              </p>
            </div>
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
    <div>
      <AdminPageHeader
        title={notFound ? "این صفحه پیدا نشد" : "تنظیمات باز نشد"}
        summary="یه مشکلی پیش اومد. صفحه رو دوباره باز کن یا چند دقیقه‌ی دیگه سر بزن."
      />
      <Link to="/admin" className={buttonVariants({ variant: "outline", className: INK_OUTLINE })}>
        برگرد به نمای کلی
      </Link>
    </div>
  );
}

// Placeholder until B5 converts this page.
export const Route = createFileRoute("/admin/settings")({});
