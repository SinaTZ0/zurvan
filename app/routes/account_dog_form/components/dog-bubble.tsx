import { cn } from "cn";

import { SpeechBubble } from "~/components/speech-bubble";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { DogFormSection } from "~/routes/account_dog_form/sections";

/*===== Lines =====*/
// What the dog says about the part of the form the owner is in. Informal spoken Persian, in the dog's voice. Everything
// the bubble says is also plain text on the page (the section reasons), so nothing here is announced.
const IDENTITY_LINES = {
  new: "اسممو بنویس تا کارتمو بزنم!",
  edit: "اگه چیزی عوض شده، درستش کن",
  // An evaluated dog's breed and birth date are locked: the dog says who can change them.
  evaluated: `ارزیابی شدم! نژاد و تاریخ تولدمو فقط ${HEAD_TRAINER.firstName} عوض می‌کنه`,
} as const;

const BODY_LINE = "اینا برای ایمنی جلسه‌هامه";
const TRAINER_LINE = `از ترس‌ها و دردام بگو؛ ${HEAD_TRAINER.firstName} قبل از جلسه‌ی اول می‌خونه`;

/*===== Dog Bubble =====*/
/**
 * The dog's chalk bubble above (desktop) or under (phone) its photo, following the form section the owner is in.
 *
 * All the lines sit in one grid cell and the current one fades in over the others, so the bubble keeps the size of the
 * longest and never jumps while the owner moves down the form. Reduced motion swaps them without the fade. The bubble
 * draws itself in once on load: the page's one orchestrated moment.
 *
 * It is for the eyes only (`aria-hidden`, no live region).
 */
export function DogBubble({
  section,
  isEdit,
  isEvaluated,
  className,
}: {
  section: DogFormSection;
  isEdit: boolean;
  /** The dog is evaluated: its identity line says who can change the locked fields. */
  isEvaluated: boolean;
  /** Grid placement from the card. */
  className?: string;
}) {
  const identityLine = !isEdit ? IDENTITY_LINES.new : isEvaluated ? IDENTITY_LINES.evaluated : IDENTITY_LINES.edit;
  const lines: { section: DogFormSection; text: string }[] = [
    { section: "identity", text: identityLine },
    { section: "body", text: BODY_LINE },
    { section: "trainer", text: TRAINER_LINE },
  ];

  return (
    <div aria-hidden className={cn("justify-self-start", className)}>
      {/* The tail points up at the photo strip on phones, and down at the photo frame on desktop. */}
      <SpeechBubble drawIn tail="top-start" lgTail="bottom-start" className="max-w-[17rem] sm:max-w-xs">
        <span className="grid items-center">
          {lines.map((line) => (
            <span
              key={line.section}
              className={cn(
                "col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500",
                line.section === section ? "opacity-100" : "opacity-0",
              )}
            >
              {line.text}
            </span>
          ))}
        </span>
      </SpeechBubble>
    </div>
  );
}
