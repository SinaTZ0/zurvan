/*===== Head Trainer =====*/
// The center is his practice: he founded it, runs the evaluations and is the app's only Admin and only trainer (the
// owner confirmed it; the two placeholder colleagues' cards in `routes/home/components/team-section.tsx` are kept but
// not rendered). The storefront, the footer and the auth page speak about him, so his details live in one place.
//
// Name, experience and credentials supplied on the owner's business card. The photos are the two the owner sent on
// 2026-10-19 (WhatsApp, 720x1080), so they are the largest the site can serve: nothing is upscaled. Which of the two is
// the owner's chosen introduction photo is not settled (docs/overnight/03-DECISIONS-NEEDED.md): to swap them, swap the
// two entries below. Words inside the pictures (the banners, the logos) are part of the pictures and are not quoted by
// any text on the site; the alt texts describe the scene only.
export const HEAD_TRAINER = {
  name: "طلا راستی",
  /** Used where the page speaks about the trainer casually: "ارزیابی رایگان با طلا". */
  firstName: "طلا",
  role: "متخصص تربیت، رفتارشناسی و اصلاح رفتار سگ",
  years: 13,
  credential: "مدرک بین‌المللی از فدراسیون جهانی سگ",
  /**
   * The slogan printed on the owner's card. It is recorded here and not shown: the site still carries the Persian
   * «تجربه، دانش، نتیجه.» (Services section) until the owner gives final approval to replace it.
   */
  cardSlogan: "EXPERIENCE. KNOWLEDGE. RESULT.",
  photos: {
    /** Crouched beside the dog, both faces to the camera. The home page's trainer section (the dog is the speaker). */
    withDog: {
      src: "/photo/trainer/tala-dog-720.webp",
      srcSet: "/photo/trainer/tala-dog-480.webp 480w, /photo/trainer/tala-dog-720.webp 720w",
      width: 720,
      height: 1080,
      alt: "طلا کنار سگش نشسته و هر دو رو به دوربین هستند؛ پشت‌شان کوهستان است",
    },
    /** Standing, the dog sitting at their side, a sunset over the mountains. The About page. */
    standing: {
      src: "/photo/trainer/tala-standing-720.webp",
      srcSet: "/photo/trainer/tala-standing-480.webp 480w, /photo/trainer/tala-standing-720.webp 720w",
      width: 720,
      height: 1080,
      alt: "طلا ایستاده و سگش کنارش نشسته؛ غروب آفتاب بالای کوهستان است",
    },
    /** A square around the face in `withDog`, for the small round picture on course pages. Decorative (empty alt). */
    avatar: {
      src: "/photo/trainer/tala-avatar-192.webp",
      width: 192,
      height: 192,
    },
  },
} as const;
