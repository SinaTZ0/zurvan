/*===== Center Contact =====*/
// Contact details supplied on the owner's business card. Browser-safe so every call link uses the same number.
export const CENTER_PHONE = {
  /** For `tel:` links. */
  tel: "09214087867",
  /** As people read it, in Persian digits. Show it inside `dir="ltr"`. */
  display: "۰۹۲۱۴۰۸۷۸۶۷",
};

export const CENTER_SERVICE_AREA = "تمام نقاط تهران";

/*===== Profiles =====*/
// Each on its own because the contact page and the help page's ask link to them one by one. The footer lists them all.
export const CENTER_TELEGRAM = {
  label: "تلگرام",
  handle: "k9trainingzurvan",
  href: "https://t.me/k9trainingzurvan",
} as const;

export const CENTER_INSTAGRAM = {
  label: "اینستاگرام",
  handle: "K9training.zurvan",
  href: "https://www.instagram.com/k9training.zurvan/",
} as const;

export const CENTER_YOUTUBE = {
  label: "یوتیوب",
  handle: "@k9trainingzurvan",
  href: "https://www.youtube.com/@k9trainingzurvan",
} as const;

// Still to come from the owner: the second phone number and a verified WhatsApp link (never guess either).
// The «وب‌سایت: k9training.ir» link was dropped on 2026-10-18: the owner called it a redundant link to an old domain,
// and the address didn't answer when checked.

export const CENTER_LINKS = [CENTER_INSTAGRAM, CENTER_YOUTUBE, CENTER_TELEGRAM] as const;
