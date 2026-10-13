import { XIcon } from "lucide-react";
import { useState } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { Button } from "~/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "~/components/ui/sheet";
import { Spinner } from "~/components/ui/spinner";
import { useAdminAction } from "~/hooks/use-admin-action";
import { useIsMobile } from "~/hooks/use-mobile";
import { formatToman } from "~/lib/course-format";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import { client } from "~/orpc/client";
import type { AdminCommission } from "~/orpc/commission/contract";
import type { AdminPartner } from "~/orpc/partner/contract";
import { CopyButton } from "~/routes/admin_partners/components/copy-button";
import { PersonRow } from "~/routes/admin_partners/components/person-row";
import { ShebaInset } from "~/routes/admin_partners/components/sheba-inset";

/*===== Partner Drawer =====*/
/**
 * One partner in full: how to reach and pay him, his link, the people he brought, his commissions, and the switch that
 * opens or closes his account. A side sheet on desktop, a bottom sheet on phones. The page finds the partner in the whole
 * list, so after a write the drawer stays open on the fresh data. It is not `ui/drawer`, which positions physically and
 * is wrong in RTL.
 */
export function PartnerDrawer({
  partnerId,
  partner,
  commissions,
  siteOrigin,
  onClose,
  onPay,
  onDeactivate,
}: {
  /** From `?partner=`; null means closed. */
  partnerId: string | null;
  /** The match for the id in the full list; null when the id is unknown. */
  partner: AdminPartner | null;
  /** Only this partner's commissions, oldest first. */
  commissions: readonly AdminCommission[];
  /** The site's address, to show the referral link as it will be printed. */
  siteOrigin: string;
  onClose: () => void;
  onPay: (commission: AdminCommission) => void;
  onDeactivate: () => void;
}) {
  const isMobile = useIsMobile();

  // While the sheet fades out the id is already gone from the URL: keep drawing the last one instead of flashing the
  // "not found" body. Set during render (not in an effect) so there is no frame with stale content.
  const [last, setLast] = useState<{
    id: string;
    partner: AdminPartner | null;
    commissions: readonly AdminCommission[];
  } | null>(null);
  if (partnerId !== null && (last?.id !== partnerId || last.partner !== partner || last.commissions !== commissions)) {
    setLast({ id: partnerId, partner, commissions });
  }
  const current = partnerId === null ? last : { partner, commissions };

  return (
    <Sheet open={partnerId !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        showCloseButton={false}
        className="gap-0 p-0 data-[side=bottom]:max-h-[90dvh] data-[side=bottom]:rounded-t-3xl data-[side=left]:w-full data-[side=left]:sm:max-w-lg"
      >
        {current &&
          (current.partner ? (
            <DrawerBody
              partner={current.partner}
              commissions={current.commissions}
              siteOrigin={siteOrigin}
              onPay={onPay}
              onDeactivate={onDeactivate}
            />
          ) : (
            <MissingBody />
          ))}
      </SheetContent>
    </Sheet>
  );
}

/*===== Close Button =====*/
function CloseButton() {
  return (
    <SheetClose render={<Button variant="ghost" size="icon-sm" aria-label="بستن" className="shrink-0" />}>
      <XIcon aria-hidden />
    </SheetClose>
  );
}

/*===== Unknown Id =====*/
// A link to a partner that isn't in the list (an old bookmark).
function MissingBody() {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <SheetTitle className="text-base font-bold">این همکار پیدا نشد</SheetTitle>
      <SheetDescription className="sr-only">شناسه‌ی همکار در فهرست نیست.</SheetDescription>
      <CloseButton />
    </div>
  );
}

/*===== Body =====*/
function DrawerBody({
  partner,
  commissions,
  siteOrigin,
  onPay,
  onDeactivate,
}: {
  partner: AdminPartner;
  commissions: readonly AdminCommission[];
  siteOrigin: string;
  onPay: (commission: AdminCommission) => void;
  onDeactivate: () => void;
}) {
  const link = `${siteOrigin}/?ref=${partner.code}`;

  /*------ Activate ------*/
  // No dialog: it only makes the link and numbers count for later sign-ups again.
  const activate = useAdminAction({
    mutationFn: (id: string) => client.partner.admin.setActive({ id, isActive: true }),
    success: `${partner.name} دوباره فعال شد`,
  });

  const unpaid = commissions.filter((commission) => commission.paidAt === null);
  const paid = commissions.filter((commission) => commission.paidAt !== null);

  return (
    <>
      {/*===== Header (fixed) =====*/}
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <SheetTitle className="text-lg font-extrabold text-balance">
              <bdi>{partner.name}</bdi>
            </SheetTitle>
            <span className="inline-flex h-7 items-center rounded-full border border-border px-2.5 text-xs font-bold text-muted-foreground">
              {partner.isActive ? "فعال" : "غیرفعال"}
            </span>
          </div>
          <SheetDescription className="mt-0.5 text-xs">
            همکار از {formatJalaliTimestamp(partner.createdAt)}
          </SheetDescription>
        </div>
        <CloseButton />
      </header>

      {/*===== Scrolling body =====*/}
      <div data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        {/*------ Call ------*/}
        <div className="rounded-2xl border border-border bg-card p-4">
          <CustomerContact
            name={partner.name}
            phoneNumber={partner.phoneNumber}
            variant="call"
            className="[&>span:first-child]:sr-only"
          />
        </div>

        {/*------ Link and Sheba ------*/}
        <section aria-labelledby="partner-link" className="grid gap-3">
          <h3 id="partner-link" className="text-sm font-bold">
            لینک و شبا
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <p className="min-w-0 rounded-lg bg-background px-3 py-2 text-sm break-all">
              <span className="sr-only">لینک: </span>
              <bdi dir="ltr">{link}</bdi>
            </p>
            <CopyButton text={link} label="کپی" className="max-sm:w-full sm:shrink-0" />
          </div>
          {partner.shebaNumber ? (
            <ShebaInset sheba={partner.shebaNumber} name={partner.name} insetClassName="bg-background" />
          ) : (
            <p className="text-sm text-muted-foreground">هنوز شبا ننوشته</p>
          )}
        </section>

        {/*------ People ------*/}
        <section aria-labelledby="partner-people" className="grid gap-1">
          <h3 id="partner-people" className="text-sm font-bold">
            شماره‌ها و مشتری‌ها
          </h3>
          {partner.people.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز شماره‌ای ثبت نشده و کسی با لینکش نیامده.</p>
          ) : (
            <ul className="divide-y divide-border">
              {partner.people.map((person) => (
                <PersonRow key={`${person.source}-${person.id}`} person={person} />
              ))}
            </ul>
          )}
        </section>

        {/*------ Commissions ------*/}
        <section aria-labelledby="partner-commissions" className="grid gap-1">
          <h3 id="partner-commissions" className="text-sm font-bold">
            پورسانت‌ها
          </h3>
          {commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز پورسانتی نوشته نشده.</p>
          ) : (
            <ul className="divide-y divide-border">
              {[...unpaid, ...paid].map((commission) => (
                <li key={commission.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      <bdi>{commission.customer.name}</bdi>
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {commission.paidAt
                        ? `پرداخت شد ${formatJalaliTimestamp(commission.paidAt)}`
                        : `${formatNumberFa(commission.percent)}٪ از ${formatToman(commission.baseAmount)} · ${formatJalaliTimestamp(commission.createdAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold tabular-nums">{formatToman(commission.amount)}</p>
                    {!commission.paidAt && (
                      <Button type="button" variant="solid" size="sm" onClick={() => onPay(commission)}>
                        پرداخت شد
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/*------ Account Switch ------*/}
        <div className="border-t border-border pt-6">
          {partner.isActive ? (
            <Button type="button" variant="outline" className="text-destructive" onClick={onDeactivate}>
              غیرفعال کردن همکار
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={activate.isPending}
              onClick={() => activate.run(partner.id)}
            >
              {activate.isPending && <Spinner aria-hidden />}
              فعال کردن دوباره
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
