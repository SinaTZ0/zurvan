/*===== Head Trainer =====*/
// The center is his practice: he founded it, runs the evaluations and is the app's only Admin. The home page also
// shows two colleagues as equals (`routes/home/components/team-section.tsx`), but the storefront, the footer and the
// auth page speak about him, so his details live in one place.
//
// Sample data: the name, years and photo are placeholders until the owner sends the real ones.
export const HEAD_TRAINER = {
  name: "طلا راستی",
  /** Used where the page speaks about him casually: "ارزیابی رایگان با طلا". */
  firstName: "طلا",
  role: "مربی و بنیان‌گذار آموزش K9",
  years: 12,
  photo: {
    src: "/photo/deal-city.jpg",
    width: 800,
    height: 600,
    alt: "مربی در پیاده‌رو با سگی که روی دو پا ایستاده تمرین می‌کند",
  },
} as const;
