import { SpeechBubble } from "~/components/speech-bubble";

/*===== Partner Bubble =====*/
/**
 * The stock cut-out dog with one line, the page's only speech. The line says what the link does, so nothing else on
 * the page needs explaining it. The dog is decoration: its `alt` is empty.
 */
export function PartnerBubble({ firstName }: { firstName: string }) {
  return (
    <div className="flex items-end gap-4">
      <SpeechBubble tail="bottom-start" className="max-w-[15rem] sm:max-w-xs">
        سلام {firstName}! هر کی با این لینک یا QR بیاد، به اسم تو ثبت می‌شه.
      </SpeechBubble>
      <img
        src="/photo/home/eval-dog-640.webp"
        alt=""
        width={640}
        height={879}
        className="h-auto w-20 shrink-0 sm:w-24 lg:w-28"
      />
    </div>
  );
}
