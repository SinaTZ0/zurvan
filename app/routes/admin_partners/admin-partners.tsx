import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { isRouteErrorResponse, useNavigation, useRevalidator } from "react-router";

import { AdminEmptyState } from "~/components/admin-empty-state";
import { AdminFilterPills, type AdminFilterOption } from "~/components/admin-filter-pills";
import { AdminPageHeader } from "~/components/admin-page-header";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { env } from "~/env.server";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import type { AdminCommission } from "~/orpc/commission/contract";
import { createServerClient } from "~/orpc/server-client.server";
import { CreateSheet } from "~/routes/admin_partners/components/create-sheet";
import { DeactivateDialog } from "~/routes/admin_partners/components/deactivate-dialog";
import { PaidLedger } from "~/routes/admin_partners/components/paid-ledger";
import { PartnerDrawer } from "~/routes/admin_partners/components/partner-drawer";
import { PartnerRow } from "~/routes/admin_partners/components/partner-row";
import { PayDialog } from "~/routes/admin_partners/components/pay-dialog";
import { UnpaidBlock } from "~/routes/admin_partners/components/unpaid-block";
import { groupUnpaid, isUnpaid, listPaid } from "~/routes/admin_partners/partner-views";
import {
  ADMIN_PARTNERS_PATH,
  adminPartnersSearchParams,
  type PartnerView,
  serializeAdminPartnersSearchParams,
} from "~/routes/admin_partners/search-params";

import type { Route } from "./+types/admin-partners";

/*===== Constants =====*/
const VIEW_LABELS: Record<PartnerView, string> = {
  unpaid: "پرداخت‌نشده",
  paid: "پرداخت‌شده",
  partners: "همکاران",
};

/*===== Meta =====*/
export const meta: Route.MetaFunction = () => [{ title: "همکاران | مدیریت آموزش K9" }];

/*===== Loader =====*/
// The guard is the layout's. Both lists come whole, once: the view, the counts and the open drawer are shallow URL state
// applied in the component (docs/nuqs.md), so none of them waits for the server. `siteOrigin` is only for showing the
// referral link as it will be printed.
export async function loader({ request }: Route.LoaderArgs) {
  const client = createServerClient(request);
  const [partners, commissions] = await Promise.all([client.partner.admin.list(), client.commission.admin.list({})]);

  return { partners, commissions, siteOrigin: env.BETTER_AUTH_URL.replace(/\/+$/, "") };
}

/*===== Admin Partners =====*/
/**
 * F7 and F9 for the Admin: where he pays the partners what they earned and opens or closes a partner's account. The
 * first view is the pay sheet (a block per partner who is owed, with the Sheba to copy and a «پرداخت شد» per
 * commission); the others are the ledger of what he paid and the roster. The money itself moves in his bank app: the
 * page only records it.
 */
export default function AdminPartnersPage({ loaderData }: Route.ComponentProps) {
  const { partners, commissions, siteOrigin } = loaderData;

  /*------ URL State ------*/
  const [{ view, partner: openId, new: creating }, setParams] = useQueryStates(adminPartnersSearchParams);

  /*------ Dialogs ------*/
  // One pay dialog for every «پرداخت شد» (page and drawer). The target outlives the dialog's closing so its words
  // don't blank mid-fade, and `session` remounts it for each opening so an old failure doesn't come back.
  const [payTarget, setPayTarget] = useState<{ commission: AdminCommission; session: number } | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [deactivateSession, setDeactivateSession] = useState(0);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  /*------ Busy ------*/
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const busy = navigation.state !== "idle" || revalidator.state !== "idle";

  /*------ Derived Lists ------*/
  const unpaidBlocks = useMemo(() => groupUnpaid({ commissions, partners }), [commissions, partners]);
  const paidCommissions = useMemo(() => listPaid(commissions), [commissions]);
  const unpaidCount = commissions.filter(isUnpaid).length;
  const unpaidTotal = commissions.filter(isUnpaid).reduce((sum, commission) => sum + commission.amount, 0);

  const options: AdminFilterOption<PartnerView>[] = [
    { value: "unpaid", label: VIEW_LABELS.unpaid, count: unpaidCount },
    { value: "paid", label: VIEW_LABELS.paid, count: paidCommissions.length },
    { value: "partners", label: VIEW_LABELS.partners, count: partners.length },
  ];

  // The drawer looks in the full list, so a write that changes the partner doesn't close it.
  const opened = openId === null ? null : (partners.find((item) => item.id === openId) ?? null);
  const openedCommissions = useMemo(
    () =>
      commissions
        .filter((commission) => commission.partner.id === openId)
        // oxlint-disable-next-line unicorn/no-array-sort -- `filter` made our own copy
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
    [commissions, openId],
  );

  function askToPay(commission: AdminCommission) {
    setPayTarget((previous) => ({ commission, session: (previous?.session ?? 0) + 1 }));
    setPayOpen(true);
  }

  return (
    <div>
      {/*===== Header =====*/}
      <AdminPageHeader
        title="همکاران"
        summary={
          unpaidCount > 0
            ? `${formatNumberFa(unpaidCount)} پورسانت منتظر پرداخت است؛ جمعش ${formatToman(unpaidTotal)}`
            : "پورسانتی منتظر پرداخت نیست"
        }
      >
        <Button type="button" variant="solid" onClick={() => void setParams({ new: "1" })}>
          <PlusIcon aria-hidden strokeWidth={1.7} />
          همکار تازه
        </Button>
      </AdminPageHeader>

      {partners.length === 0 ? (
        /*===== Nothing at All =====*/
        <AdminEmptyState title="هنوز همکاری نیست">
          کلینیک، آرایشگاه یا پت‌شاپی که بهش قول داده‌ای را بساز؛ لینک و QR خودش را می‌گیرد.
        </AdminEmptyState>
      ) : (
        <>
          {/*===== Views =====*/}
          <AdminFilterPills
            label="نمایش"
            options={options}
            value={view}
            // Replace, not push: a view isn't a place to go Back to.
            onChange={(value) => void setParams({ view: value }, { history: "replace" })}
            className="mb-5"
          />

          <div aria-busy={busy} className={cn("transition-opacity", busy && "opacity-60")}>
            {view === "unpaid" &&
              (unpaidBlocks.length === 0 ? (
                /*===== Pay Sheet: Nothing Owed =====*/
                <AdminEmptyState title="پورسانتی منتظر نیست">
                  وقتی مشتریِ یکی از همکارها اولین خریدش را بکند، پورسانتش اینجا می‌آید تا پرداختش کنی.
                </AdminEmptyState>
              ) : (
                /*===== Pay Sheet =====*/
                <ul aria-label="همکارانی که پورسانت طلب دارند" className="flex flex-col gap-4">
                  {unpaidBlocks.map((block) => (
                    <UnpaidBlock key={block.partnerId} block={block} onPay={askToPay} />
                  ))}
                </ul>
              ))}

            {view === "paid" &&
              (paidCommissions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  هنوز پورسانتی پرداخت نشده
                </p>
              ) : (
                /*===== Paid Ledger =====*/
                <PaidLedger commissions={paidCommissions} />
              ))}

            {view === "partners" && (
              /*===== Roster =====*/
              <ul aria-label="فهرست همکاران" className="flex flex-col gap-2">
                {partners.map((partner) => (
                  <PartnerRow
                    key={partner.id}
                    partner={partner}
                    href={serializeAdminPartnersSearchParams(ADMIN_PARTNERS_PATH, { view, partner: partner.id })}
                    onOpen={() => void setParams({ partner: partner.id })}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/*===== Partner Drawer =====*/}
      <PartnerDrawer
        partnerId={openId}
        partner={opened}
        commissions={openedCommissions}
        siteOrigin={siteOrigin}
        // Closing replaces the entry: the open state was pushed so Back closes it, but a close button must not leave a
        // forward entry that reopens it.
        onClose={() => void setParams({ partner: null }, { history: "replace" })}
        onPay={askToPay}
        onDeactivate={() => {
          setDeactivateSession((session) => session + 1);
          setDeactivateOpen(true);
        }}
      />

      {/*===== Create Sheet =====*/}
      <CreateSheet
        open={creating !== null}
        siteOrigin={siteOrigin}
        onClose={() => void setParams({ new: null }, { history: "replace" })}
        onCreated={(partner) => void setParams({ view: "partners", partner: partner.id, new: null })}
      />

      {/*===== Confirms =====*/}
      {payTarget && (
        <PayDialog key={payTarget.session} open={payOpen} onOpenChange={setPayOpen} commission={payTarget.commission} />
      )}
      {opened && (
        <DeactivateDialog
          key={`${opened.id}-${deactivateSession}`}
          open={deactivateOpen}
          onOpenChange={setDeactivateOpen}
          partner={opened}
        />
      )}
    </div>
  );
}

/*===== Error Boundary =====*/
// Renders inside the Admin layout, so the rail and tabs stay.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <section aria-labelledby="admin-partners-error-title">
      <h1 id="admin-partners-error-title" className="text-2xl font-extrabold">
        {notFound ? "این صفحه پیدا نشد" : "همکاران باز نشد"}
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
