/*===== Center Contact =====*/
// Contact details supplied on the owner's business card. Browser-safe so every call link uses the same number.
export const CENTER_PHONE = {
  /** For `tel:` links. */
  tel: "09214087867",
  /** As people read it, in Persian digits. Show it inside `dir="ltr"`. */
  display: "۰۹۲۱۴۰۸۷۸۶۷",
};

export const CENTER_SERVICE_AREA = "تمام نقاط تهران";

/** Telegram on its own, because the «جواب سوالت رو پیدا نکردی؟» ask links straight to it next to the phone. */
export const CENTER_TELEGRAM = {
  label: "تلگرام",
  handle: "k9trainingzurvan",
  href: "https://t.me/k9trainingzurvan",
} as const;

// Still to come from the owner: the second phone number and a verified WhatsApp link (never guess either).
// The «وب‌سایت: k9training.ir» link was dropped on 2026-10-18: the owner called it a redundant link to an old domain,
// and the address didn't answer when checked.

export const CENTER_LINKS = [
  { label: "اینستاگرام", handle: "K9training.zurvan", href: "https://www.instagram.com/k9training.zurvan/" },
  { label: "یوتیوب", handle: "@k9trainingzurvan", href: "https://www.youtube.com/@k9trainingzurvan" },
  CENTER_TELEGRAM,
] as const;
