/*===== Center Contact =====*/
// Contact details supplied on the owner's business card. Browser-safe so every call link uses the same number.
export const CENTER_PHONE = {
  /** For `tel:` links. */
  tel: "09214087867",
  /** As people read it, in Persian digits. Show it inside `dir="ltr"`. */
  display: "۰۹۲۱۴۰۸۷۸۶۷",
};

export const CENTER_SERVICE_AREA = "تمام نقاط تهران";

export const CENTER_LINKS = [
  { label: "وب‌سایت", handle: "k9training.ir", href: "https://k9training.ir/" },
  { label: "اینستاگرام", handle: "K9training.zurvan", href: "https://www.instagram.com/k9training.zurvan/" },
  { label: "یوتیوب", handle: "@k9trainingzurvan", href: "https://www.youtube.com/@k9trainingzurvan" },
  { label: "تلگرام", handle: "k9trainingzurvan", href: "https://t.me/k9trainingzurvan" },
] as const;
