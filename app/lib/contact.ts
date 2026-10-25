import { m } from "~/paraglide/messages";

/*===== Center Contact =====*/
// Contact details supplied on the owner's business card. Browser-safe so every call link uses the same number.
// The words are messages (`messages/shared/`) read through getters, in the page's language: read them while rendering,
// never into a module-level constant.
export const CENTER_PHONE = {
  /** For `tel:` links. */
  tel: "09214087867",
  /** As people read it: Persian digits on the Persian pages, grouped Latin digits on the English ones. Show it inside `dir="ltr"`. */
  get display() {
    return m.shared_contact_phone_display();
  },
};

/**
 * The owner's second number (sent 2026-10-26). Calls and the one-button asks keep using `CENTER_PHONE`; this one is
 * listed beside it only where the center's details are listed in full (the contact page, the footers, the menu).
 */
export const CENTER_PHONE_SECOND = {
  tel: "09023804420",
  get display() {
    return m.shared_contact_phone_second_display();
  },
};

/**
 * The center's words: the wordmark («زروان», «Zurvann» on the English pages, the owner's choice of 2026-10-22), the
 * full name line under it (the owner asked for both, 2026-10-18) and the service area from the business card.
 */
export const CENTER = {
  get name() {
    return m.shared_brand_name();
  },
  get descriptor() {
    return m.shared_contact_descriptor();
  },
  /** «تمام نقاط تهران». */
  get serviceArea() {
    return m.shared_contact_service_area();
  },
};

/*===== Profiles =====*/
// Each on its own because the contact page and the help page's ask link to them one by one. The footer lists them all.
export const CENTER_TELEGRAM = {
  get label() {
    return m.shared_contact_telegram();
  },
  handle: "k9trainingzurvan",
  href: "https://t.me/k9trainingzurvan",
} as const;

export const CENTER_INSTAGRAM = {
  get label() {
    return m.shared_contact_instagram();
  },
  handle: "K9training.zurvan",
  href: "https://www.instagram.com/k9training.zurvan/",
} as const;

/**
 * On the main number (`CENTER_PHONE`), the owner's word of 2026-10-26; it took YouTube's place. The handle is the
 * number as people read it.
 */
export const CENTER_WHATSAPP = {
  get label() {
    return m.shared_contact_whatsapp();
  },
  get handle() {
    return CENTER_PHONE.display;
  },
  // wa.me takes the number in international form, without the leading 0 or a +.
  href: "https://wa.me/989214087867",
} as const;

// The «وب‌سایت: k9training.ir» link was dropped on 2026-10-18: the owner called it a redundant link to an old domain,
// and the address didn't answer when checked.

export const CENTER_LINKS = [CENTER_INSTAGRAM, CENTER_WHATSAPP, CENTER_TELEGRAM] as const;
