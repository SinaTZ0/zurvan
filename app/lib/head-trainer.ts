import { toPersianDigits } from "~/lib/digits";
import { isoToJalali, todayIso } from "~/lib/jalali";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";

/*===== Head Trainer =====*/
// The center is her practice: she founded it, runs the evaluations and is the app's only Admin and only trainer (the
// owner confirmed it; the two placeholder colleagues' cards were removed with the old home page and are in git
// history). The storefront, the footer and the auth page speak about her, so her details live in one place.
//
// Name, experience and credentials supplied on the owner's business card. The photos are edits (2026-10-22) of the two
// the owner sent on 2026-10-19: the same face, but a trainer's everyday clothes and a daylight training field in place
// of the tactical outfit, the sunset and the branded truck and banners, so they read as the trainer at work rather than
// an advert. 1024x1536, served at 480, 720 and 1024. The owner hasn't seen the edits yet, and which photo is the chosen
// introduction photo is still open (docs/overnight/03-DECISIONS-NEEDED.md): to swap them, swap the two entries below.
//
// The words are messages (`messages/shared/`), read through getters, so each read is in the page's language and every
// caller keeps writing `HEAD_TRAINER.name`. Read them while rendering, never into a module-level constant: that would
// freeze the language the module happened to load in.
export const HEAD_TRAINER = {
  get name() {
    return m.shared_trainer_name();
  },
  /** Used where the page speaks about the trainer casually: "ارزیابی رایگان با طلا". */
  get firstName() {
    return m.shared_trainer_first_name();
  },
  get role() {
    return m.shared_trainer_role();
  },
  /**
   * Years since `since`, counted from today's Jalali year in Tehran, so it goes up by one at Nowruz without an edit.
   * Tehran time (not the visitor's zone) keeps the server render and the browser on the same number.
   */
  get years() {
    return isoToJalali(todayIso()).year - this.since;
  },
  /** The year (Solar Hijri) the trainer started working with dogs; the new home page says «از سال ۱۳۹۳» (owner, 2026-10-20; was ۱۳۹۲ until 2026-10-26). */
  since: 1393,
  /** The same year in the Gregorian calendar (1393 began in March 2014), for the English pages. */
  sinceGregorian: 2014,
  /** «۱۳۹۳» on the Persian pages, «2014» on the English ones: the year in the page's own calendar and digits. */
  get sinceYear() {
    return getLocale() === "fa" ? toPersianDigits(String(this.since)) : String(this.sinceGregorian);
  },
  get credential() {
    return m.shared_trainer_credential();
  },
  /**
   * The slogan printed on the owner's card. It is recorded here and not shown: the site still carries the Persian
   * «تجربه، دانش، نتیجه.» (Services section) until the owner gives final approval to replace it.
   */
  cardSlogan: "EXPERIENCE. KNOWLEDGE. RESULT.",
  photos: {
    /** Kneeling with a hand on the dog's chest, the dog looking up at her. The home page's trainer section (the dog is the speaker). */
    withDog: {
      src: "/photo/trainer/tala-dog-720.webp",
      srcSet:
        "/photo/trainer/tala-dog-480.webp 480w, /photo/trainer/tala-dog-720.webp 720w, /photo/trainer/tala-dog-1024.webp 1024w",
      width: 1024,
      height: 1536,
      get alt() {
        return m.shared_trainer_photo_with_dog_alt();
      },
    },
    /** Standing with the leash, the dog sitting at her side and looking up at her. The About page. */
    standing: {
      src: "/photo/trainer/tala-standing-720.webp",
      srcSet:
        "/photo/trainer/tala-standing-480.webp 480w, /photo/trainer/tala-standing-720.webp 720w, /photo/trainer/tala-standing-1024.webp 1024w",
      width: 1024,
      height: 1536,
      get alt() {
        return m.shared_trainer_photo_standing_alt();
      },
    },
    /** A square around the face in `withDog`, for the small round picture on course pages. Decorative (empty alt). */
    avatar: {
      src: "/photo/trainer/tala-avatar-192.webp",
      width: 192,
      height: 192,
    },
  },
} as const;
