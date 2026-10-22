/*===== Head Trainer =====*/
// The center is his practice: he founded it, runs the evaluations and is the app's only Admin and only trainer (the
// owner confirmed it; the two placeholder colleagues' cards were removed with the old home page and are in git
// history). The storefront, the footer and the auth page speak about him, so his details live in one place.
//
// Name, experience and credentials supplied on the owner's business card. The photos are edits (2026-10-22) of the two
// the owner sent on 2026-10-19: the same face, but a trainer's everyday clothes and a daylight training field in place
// of the tactical outfit, the sunset and the branded truck and banners, so they read as the trainer at work rather than
// an advert. 1024x1536, served at 480, 720 and 1024. The owner hasn't seen the edits yet, and which photo is the chosen
// introduction photo is still open (docs/overnight/03-DECISIONS-NEEDED.md): to swap them, swap the two entries below.
export const HEAD_TRAINER = {
  name: "طلا راستی",
  /** Used where the page speaks about the trainer casually: "ارزیابی رایگان با طلا". */
  firstName: "طلا",
  role: "متخصص تربیت، رفتارشناسی و اصلاح رفتار سگ",
  years: 13,
  /** The year (Solar Hijri) the trainer started working with dogs; the new home page says «از سال ۱۳۹۲» (owner, 2026-10-20). */
  since: 1392,
  credential: "مدرک بین‌المللی از فدراسیون جهانی سگ",
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
      alt: "طلا کنار سگش زانو زده و دستش روی سینه‌ی اوست؛ سگ سرش را بالا گرفته و نگاهش می‌کند. پشت‌شان زمین تمرین است",
    },
    /** Standing with the leash, the dog sitting at her side and looking up at her. The About page. */
    standing: {
      src: "/photo/trainer/tala-standing-720.webp",
      srcSet:
        "/photo/trainer/tala-standing-480.webp 480w, /photo/trainer/tala-standing-720.webp 720w, /photo/trainer/tala-standing-1024.webp 1024w",
      width: 1024,
      height: 1536,
      alt: "طلا قلاده به دست ایستاده و سگش کنارش نشسته و نگاهش می‌کند؛ پشت‌شان زمین تمرین و نرده‌ی چوبی است",
    },
    /** A square around the face in `withDog`, for the small round picture on course pages. Decorative (empty alt). */
    avatar: {
      src: "/photo/trainer/tala-avatar-192.webp",
      width: 192,
      height: 192,
    },
  },
} as const;
