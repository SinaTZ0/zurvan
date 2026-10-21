import { useState } from "react";

import { USER_ROLE_LABELS } from "~/lib/user-constants";
import type { CardVoiceProps } from "~/routes/account_profile/card-voice-props";
import { COLUMN } from "~/routes/account_profile/column";
import { NameCard } from "~/routes/account_profile/components/name-card";
import { PageHeader } from "~/routes/account_profile/components/page-header";
import { PageMotion } from "~/routes/account_profile/components/page-motion";
import { PasswordCard } from "~/routes/account_profile/components/password-card";
import { ShebaCard } from "~/routes/account_profile/components/sheba-card";
import { TagStage } from "~/routes/account_profile/components/tag-stage";
import { type ProfileCard, useCardVoice } from "~/routes/account_profile/hooks/use-card-voice";
import { useDebounced } from "~/routes/account_profile/hooks/use-debounced";
import { useFlash } from "~/routes/account_profile/hooks/use-flash";
import { useNameForm } from "~/routes/account_profile/hooks/use-name-form";
import { cardLine } from "~/routes/account_profile/lines";

/** How long the name must stay still before the tag engraves it. */
const ENGRAVE_AFTER_MS = 320;

/*===== Profile Settings =====*/
/**
 * The whole body of the page: the header, the person's tag on the hall stand, and the cards. The cards are independent
 * (each saves on its own, with its own pending and error state); this component joins them to the tag and to their
 * dogs: what is typed in the name card engraves the tag, the card the person is in is the one whose dog speaks, a
 * refused submit makes that dog say so, and a save makes him say «ثبت شد!» (a saved name also swings the tag).
 *
 * Phones: the header, the tag's stage, then the cards. Desktop: a 5/7 split, the tag's stage at the start and sticky,
 * the cards at the end.
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
  /** Whether the person has set a password; the password card's wording follows. */
  hasPassword: boolean;
}) {
  const { voice, enter, fail, celebrate } = useCardVoice();
  const nameSaved = useFlash();
  const [swing, setSwing] = useState(0);
  const nameForm = useNameForm({
    initial: { firstName, lastName },
    onSaved: () => {
      celebrate("name");
      nameSaved.flash();
      setSwing((count) => count + 1);
    },
    onFailed: () => fail("name"),
  });

  /*------ The Tag's Name ------*/
  const { preview } = nameForm;
  const typedName = `${preview.firstName} ${preview.lastName}`.trim();
  const engraved = useDebounced({ value: typedName, ms: ENGRAVE_AFTER_MS });

  /*------ The Dogs' Voices ------*/
  function voiceOf(card: ProfileCard): CardVoiceProps {
    const said = voice.said[card];
    return {
      line: cardLine({ card, mood: said ?? "intro" }),
      speaking: voice.card === card,
      hasSpoken: said !== undefined,
      take: voice.take,
    };
  }

  return (
    <div className={`${COLUMN} pt-6 lg:pt-section-sm`}>
      <PageMotion />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-y-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-12 xl:gap-x-16">
        {/*===== Header =====*/}
        <div className="lg:col-span-2 lg:pb-4">
          <PageHeader isPartner={isPartner} />
        </div>

        {/*===== Tag =====*/}
        {/* Sticky on desktop so the engraving stays in view while the cards scroll past. */}
        <TagStage
          initial={Array.from(engraved)[0] ?? ""}
          name={engraved}
          roleLabel={isPartner ? USER_ROLE_LABELS.partner : null}
          phoneNumber={phoneNumber}
          swing={swing}
          className="lg:sticky lg:top-24 lg:self-start"
        />

        {/*===== Cards =====*/}
        <div className="flex flex-col gap-14 pt-4 lg:pt-0">
          <NameCard
            form={nameForm.form}
            onSubmit={nameForm.onSubmit}
            isPending={nameForm.isPending}
            isDirty={nameForm.isDirty}
            isSaved={nameSaved.on}
            voice={voiceOf("name")}
            onEnter={() => enter("name")}
          />
          <PasswordCard
            hasPassword={hasPassword}
            voice={voiceOf("password")}
            onEnter={() => enter("password")}
            onSaved={() => celebrate("password")}
            onFailed={() => fail("password")}
          />
          {isPartner && (
            <ShebaCard
              savedSheba={shebaNumber}
              voice={voiceOf("sheba")}
              onEnter={() => enter("sheba")}
              onSaved={() => celebrate("sheba")}
              onFailed={() => fail("sheba")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
