import { HEAD_TRAINER } from "~/lib/head-trainer";
import type { ProfileCard, VoiceMood } from "~/routes/account_profile/hooks/use-card-voice";

/*===== The Dogs' Lines =====*/
// Informal spoken Persian, in the center's dog's first person: short, no orders, no promises. Each card's plain
// description says the same thing in words a screen reader reads, so the bubbles are for the eyes only.
const INTRO: Record<ProfileCard, string> = {
  name: `اسمتو درست بنویس تا ${HEAD_TRAINER.firstName} بدونه با کی کار می‌کنه.`,
  password: "رمز بذار تا دفعه‌ی بعد بدون منتظر پیامک بیای تو.",
  sheba: `شبا رو بنویس تا ${HEAD_TRAINER.firstName} پورسانتت رو بفرسته.`,
};

const ERROR_LINE = "یه جاش درست نیست؛ قرمزها رو ببین.";
const SAVED_LINE = "ثبت شد!";

/** What a card's dog says in a mood. */
export function cardLine({ card, mood }: { card: ProfileCard; mood: VoiceMood }): string {
  if (mood === "error") return ERROR_LINE;
  if (mood === "saved") return SAVED_LINE;
  return INTRO[card];
}
