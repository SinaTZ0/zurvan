/*===== Head Trainer =====*/
// The center is one trainer's practice: he teaches the courses himself, sometimes with an assistant, and the site
// exists to sell him and his name. The storefront, the footer and the auth page all speak about him, so his details
// live in one place.
//
// Sample data: the name, years and photo are placeholders until the owner sends the real ones.
export const HEAD_TRAINER = {
  name: "آرمان رستمی",
  /** Used where the page speaks about him casually: "ارزیابی رایگان با آرمان". */
  firstName: "آرمان",
  role: "مربی و بنیان‌گذار آموزش K9",
  years: 12,
  photo: {
    src: "/photo/deal-city.jpg",
    width: 800,
    height: 600,
    alt: "مربی در پیاده‌رو با سگی که روی دو پا ایستاده تمرین می‌کند",
  },
} as const;
