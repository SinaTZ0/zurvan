import { cn } from "cn";
import { ChevronLeftIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

import { CustomerContact } from "~/components/customer-contact";
import { DogThumb } from "~/components/dog-thumb";
import { Link } from "~/components/link";
import { Button, buttonVariants } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { ADMIN_TEAR } from "~/lib/admin-plate";
import { DISPLAY_HEADING } from "~/lib/display-heading";
import type { AdminUser } from "~/orpc/user/contract";
import { DangerZone } from "~/routes/admin_users/components/danger-zone";
import { NameForm } from "~/routes/admin_users/components/name-form";
import { RoleChip, StatusChip } from "~/routes/admin_users/components/user-chips";
import { UserDisc } from "~/routes/admin_users/components/user-disc";
import { UserFacts } from "~/routes/admin_users/components/user-facts";
import { DIALOG_SECTION } from "~/routes/admin_users/dialog-plate";
import { isNameless, spokenName } from "~/routes/admin_users/people";
import type { OwnedDog, PartnerFacts } from "~/routes/admin_users/roll-data";

/*===== User Dialog =====*/
/**
 * One person in full, in Batch 1's dialog look: the head (the disc, the name in Estedad, the chips and the number as the
 * call pill), then the name form, the facts that can't change, where their things live (the customer's dogs, the
 * partner's row) and the danger zone last. Opened by `?user=<id>` so Back closes it. A centred dialog on desktop, a
 * full-width sheet anchored to the bottom on phones (the stock dialog is centred, so the phone position is overridden
 * here).
 *
 * The page finds the person in the whole list, so after a name save the dialog stays open on the fresh data.
 */
export function UserDialog({
  userId,
  user,
  dogs,
  partner,
  onClose,
  onStatusConfirmed,
}: {
  /** From `?user=`; null means closed. */
  userId: string | null;
  /** The match for the id in the full list; null when the id is unknown (the page clears the param). */
  user: AdminUser | null;
  /** The customer's dogs, from the page's queries. */
  dogs: readonly OwnedDog[];
  /** The partner's code and switch, from the page's queries. */
  partner: PartnerFacts | undefined;
  onClose: () => void;
  /** The API accepted a block or an unblock (before the list reloads). */
  onStatusConfirmed: (saved: AdminUser) => void;
}) {
  // While the dialog fades out the id is already gone from the URL: keep drawing the last person instead of an empty
  // body. Set during render (not in an effect) so there is no frame with stale content.
  const [last, setLast] = useState<{ user: AdminUser; dogs: readonly OwnedDog[]; partner?: PartnerFacts } | null>(null);
  if (user !== null && last?.user !== user) setLast({ user, dogs, partner });
  const current = userId === null ? last : user && { user, dogs, partner };

  // Focus lands on the dialog itself, not the first field: on a phone the keyboard would open over the very thing the
  // Admin came to read, and most visits only read or press the block button.
  const popupRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={userId !== null && user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        ref={popupRef}
        initialFocus={popupRef}
        showCloseButton={false}
        className={cn(
          "max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-3xl paper-grain p-0 sm:max-w-lg",
          // The block confirm opens over it without a backdrop of its own (Base UI draws one per stack): the dialog
          // dims itself under it, so the question is the one lit thing.
          "after:pointer-events-none after:absolute after:inset-0 after:bg-black/55 after:opacity-0 after:transition-opacity after:duration-150 data-nested-dialog-open:after:opacity-100 motion-reduce:after:transition-none",
          // Phones: pinned to the bottom edge, full width, rounded on top only. `max-sm:translate-x-0` also needs its
          // `rtl:` twin because the stock dialog centres with `rtl:translate-x-1/2`.
          "max-sm:start-0 max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:rtl:translate-x-0",
        )}
      >
        {current && (
          <Body
            key={current.user.id}
            user={current.user}
            dogs={current.dogs}
            partner={current.partner}
            onClose={onClose}
            onStatusConfirmed={onStatusConfirmed}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/*===== Body =====*/
function Body({
  user,
  dogs,
  partner,
  onClose,
  onStatusConfirmed,
}: {
  user: AdminUser;
  dogs: readonly OwnedDog[];
  partner: PartnerFacts | undefined;
  onClose: () => void;
  onStatusConfirmed: (saved: AdminUser) => void;
}) {
  const nameless = isNameless(user);

  return (
    <>
      {/*===== Head (fixed) =====*/}
      <header className={cn("grid gap-3 border-b-2 p-5 sm:gap-2", ADMIN_TEAR)}>
        <div className="flex items-start gap-4">
          <UserDisc user={user} className="size-12 text-xl" />
          <div className="min-w-0 flex-1">
            <DialogTitle className={cn(DISPLAY_HEADING, "text-xl break-words", nameless && "text-muted-foreground")}>
              {nameless ? "بی‌نام" : <bdi>{user.name}</bdi>}
            </DialogTitle>
            <DialogDescription className="sr-only">اسم، اطلاعات و وضعیت حساب این کاربر</DialogDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleChip role={user.role} />
              <StatusChip status={user.status} />
              {user.isSelf && <span className="text-xs text-muted-foreground">حساب خودت</span>}
            </div>
          </div>
          <DialogClose
            render={<Button variant="ghost" size="icon" aria-label="بستن" className="-me-2 -mt-1 shrink-0" />}
          >
            <XIcon aria-hidden />
          </DialogClose>
        </div>

        {/*------ Call ------*/}
        {/* The name is already the title: the contact's own copy of it is hidden, keeping the gold-outlined call pill.
            Full width on a phone, where it is the main thing to press; from `sm` it lines up under the title. */}
        <CustomerContact
          name={nameless ? "این شماره" : user.name}
          phoneNumber={user.phoneNumber}
          variant="call"
          className="sm:ps-16 [&>span:first-child]:hidden"
          callClassName="max-sm:h-12 max-sm:w-full max-sm:justify-center"
        />
      </header>

      {/*===== Body (scrolling) =====*/}
      <div
        data-lenis-prevent
        className="flex min-h-0 flex-col overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      >
        {/*------ Name ------*/}
        <section className={DIALOG_SECTION}>
          <NameForm user={user} onGone={onClose} />
        </section>

        {/*------ Facts ------*/}
        <section aria-label="اطلاعات حساب" className={DIALOG_SECTION}>
          <UserFacts user={user} />
        </section>

        {/*------ Where Their Things Live ------*/}
        {user.role === "customer" && (
          <section aria-labelledby="admin-user-dogs-title" className={DIALOG_SECTION}>
            <h3 id="admin-user-dogs-title" className="text-sm font-bold">
              سگ‌هاش
            </h3>
            <CustomerDogs dogs={dogs} />
          </section>
        )}
        {user.role === "partner" && (
          <section aria-labelledby="admin-user-partner-title" className={DIALOG_SECTION}>
            <h3 id="admin-user-partner-title" className="text-sm font-bold">
              همکاری
            </h3>
            <PartnerLine user={user} partner={partner} />
          </section>
        )}

        {/*------ Danger Zone ------*/}
        <section className={DIALOG_SECTION}>
          <DangerZone user={user} onConfirmed={onStatusConfirmed} onDone={onClose} />
        </section>
      </div>
    </>
  );
}

/*===== Customer Dogs =====*/
/** Each dog as a small print and its name, one tap to its file on Dog Detail. */
function CustomerDogs({ dogs }: { dogs: readonly OwnedDog[] }) {
  if (dogs.length === 0) return <p className="text-sm text-muted-foreground">هنوز سگی ثبت نکرده.</p>;

  return (
    <ul className="-mx-2 grid gap-1">
      {dogs.map((dog) => (
        <li key={dog.id}>
          <Link
            to="/admin/dogs/$dogId"
            params={{ dogId: dog.id }}
            className="group flex min-h-12 items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors outline-none hover:bg-foreground/[0.04] focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <DogThumb name={dog.name} photo={dog.photo} className="size-10 text-sm ring-foreground/15" />
            <bdi className="min-w-0 flex-1 truncate text-sm font-bold">{dog.name}</bdi>
            <ChevronLeftIcon
              aria-hidden
              strokeWidth={1.7}
              className="size-4 text-muted-foreground transition-[translate,color] group-hover:-translate-x-0.5 group-hover:text-foreground motion-reduce:transition-none"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

/*===== Partner Line =====*/
/** The partner's code and whether his link counts, with the way to his row on Partners. */
function PartnerLine({ user, partner }: { user: AdminUser; partner: PartnerFacts | undefined }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      {partner ? (
        <p className="text-sm">
          کد{" "}
          <bdi dir="ltr" className="font-bold">
            {partner.code}
          </bdi>
          <span className="text-muted-foreground">
            {partner.isActive ? "، لینکش روشنه" : "، غیرفعاله و لینکش کسی رو نمیاره"}
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{spokenName(user)} توی صفحه‌ی همکارا پیدا نشد.</p>
      )}
      <Link
        to="/admin/partners"
        search={{ view: "partners", partner: user.id }}
        className={buttonVariants({
          variant: "outline",
          size: "sm",
          className: "h-10 border-foreground/20 bg-transparent",
        })}
      >
        توی صفحه‌ی همکارا
      </Link>
    </div>
  );
}
