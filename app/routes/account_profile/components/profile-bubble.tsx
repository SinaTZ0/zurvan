import { cn } from "cn";

import { SpeechBubble } from "~/components/speech-bubble";
import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { ProfileFocus } from "~/routes/account_profile/hooks/use-profile-bubble";

/*===== Lines =====*/
// Informal spoken Persian, in the dog's voice. What each line says is also plain text on the page (the field labels and
// help), so nothing here is announced.
const NAME_LINE = `اسمتو درست بنویس تا ${HEAD_TRAINER.firstName} بدونه با کی کار می‌کنه.`;
const SHEBA_LINE = `شبا رو بنویس تا ${HEAD_TRAINER.firstName} کمیسیونت رو بفرسته.`;
const PASSWORD_LINE = "رمز بذار تا دفعه‌ی بعد بدون منتظر پیامک بیای تو.";
const SAVED_LINE = "ثبت شد!";

/*===== Profile Bubble =====*/
/**
 * The dog's chalk bubble, following the card the person is working in, and saying «ثبت شد!» for a moment after a save.
 *
 * All the lines sit in one grid cell and the current one fades in over the others, so the bubble keeps the size of the
 * longest and never jumps while focus moves between the cards. Reduced motion swaps them without the fade. The bubble
 * draws itself in once on load: the page's one orchestrated moment. The Sheba line is only a partner's.
 *
 * It is for the eyes only (`aria-hidden`, no live region); the save toast is what is announced.
 */
export function ProfileBubble({
  focus,
  celebrating,
  isPartner,
  className,
}: {
  focus: ProfileFocus;
  celebrating: boolean;
  isPartner: boolean;
  /** Placement from the tag card. */
  className?: string;
}) {
  const lines: { key: string; text: string; active: boolean }[] = [
    { key: "name", text: NAME_LINE, active: !celebrating && focus === "name" },
    ...(isPartner ? [{ key: "sheba", text: SHEBA_LINE, active: !celebrating && focus === "sheba" }] : []),
    { key: "password", text: PASSWORD_LINE, active: !celebrating && focus === "password" },
    { key: "saved", text: SAVED_LINE, active: celebrating },
  ];

  return (
    <div aria-hidden className={className}>
      {/* The tail points down and toward the end, where the dog stands. */}
      <SpeechBubble drawIn tail="bottom-end" className="max-w-[13rem] sm:max-w-xs lg:max-w-[16rem]">
        <span className="grid items-center">
          {lines.map((line) => (
            <span
              key={line.key}
              className={cn(
                "col-start-1 row-start-1 motion-safe:transition-opacity motion-safe:duration-500",
                line.active ? "opacity-100" : "opacity-0",
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
