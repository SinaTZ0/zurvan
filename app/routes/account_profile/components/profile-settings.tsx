import { PageHeader } from "~/routes/account_profile/components/page-header";
import { NameForm } from "~/routes/account_profile/components/name-form";
import { PasswordForm } from "~/routes/account_profile/components/password-form";
import { ProfileBubble } from "~/routes/account_profile/components/profile-bubble";
import { ProfileTag } from "~/routes/account_profile/components/profile-tag";
import { ShebaForm } from "~/routes/account_profile/components/sheba-form";
import { useNameForm } from "~/routes/account_profile/hooks/use-name-form";
import { useProfileBubble } from "~/routes/account_profile/hooks/use-profile-bubble";
import { USER_ROLE_LABELS } from "~/lib/user-constants";

/*===== Profile Settings =====*/
/**
 * The whole body of the page: the header, the person's tag and the forms. The forms are independent (each saves on its
 * own, with its own pending and error state); this component only joins them to the tag and the dog's bubble: what
 * is typed in the name form engraves the tag, which card has focus picks the dog's line, and a save makes it say
 * «ثبت شد!».
 *
 * Phones stack the tag card first and the forms under it. Desktop is a 5/7 split with the tag on the start side, sticky,
 * and the forms on the end side.
 */
export function ProfileSettings({
  firstName,
  lastName,
  phoneNumber,
  isPartner,
  shebaNumber,
  hasPassword,
}: {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isPartner: boolean;
  /** A partner's saved Sheba (`IR` + 24 digits), or null; ignored for a customer. */
  shebaNumber: string | null;
  /** Whether the person has set a password; the card's wording follows. */
  hasPassword: boolean;
}) {
  const bubble = useProfileBubble();
  const nameForm = useNameForm({ initial: { firstName, lastName }, onSaved: bubble.celebrate });

  const { preview } = nameForm;
  const previewName = `${preview.firstName} ${preview.lastName}`.trim();

  return (
    <div className="site-container py-8 lg:py-14">
      <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16">
        {/*===== Header =====*/}
        <div className="pb-6 lg:col-span-2 lg:pb-10">
          <PageHeader isPartner={isPartner} />
        </div>

        {/*===== Tag =====*/}
        {/* Sticky on desktop so the engraving stays in view while the forms scroll past. The dog zone above the card
            needs room, hence the top margin. */}
        <ProfileTag
          initial={Array.from(preview.firstName)[0] ?? ""}
          name={previewName}
          roleLabel={isPartner ? USER_ROLE_LABELS.partner : null}
          phoneNumber={phoneNumber}
          bubble={<ProfileBubble focus={bubble.focus} celebrating={bubble.celebrating} isPartner={isPartner} />}
          className="mb-8 lg:sticky lg:top-24 lg:mb-0 lg:self-start"
        />

        {/*===== Forms =====*/}
        <div className="flex flex-col gap-6 lg:gap-8">
          <NameForm
            form={nameForm.form}
            onSubmit={nameForm.onSubmit}
            isPending={nameForm.isPending}
            isDirty={nameForm.isDirty}
            onFocusCard={() => bubble.setFocus("name")}
          />
          <PasswordForm
            hasPassword={hasPassword}
            onFocusCard={() => bubble.setFocus("password")}
            onSaved={bubble.celebrate}
          />
          {isPartner && (
            <ShebaForm
              savedSheba={shebaNumber}
              onFocusCard={() => bubble.setFocus("sheba")}
              onSaved={bubble.celebrate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
