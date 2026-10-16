/*===== Head Trainer =====*/
// The center is his practice: he founded it, runs the evaluations and is the app's only Admin. The home page also
// shows two colleagues as equals (`routes/home/components/team-section.tsx`), but the storefront, the footer and the
// auth page speak about him, so his details live in one place.
//
// Name, experience and credentials supplied on the owner's business card. The photo is still a placeholder.
export const HEAD_TRAINER = {
  name: "طلا راستی",
  /** Used where the page speaks about the trainer casually: "ارزیابی رایگان با طلا". */
  firstName: "طلا",
  role: "متخصص تربیت، رفتارشناسی و اصلاح رفتار سگ",
  years: 13,
  credential: "مدرک بین‌المللی از فدراسیون جهانی سگ",
  photo: {
    src: "/photo/deal-city.jpg",
    width: 800,
    height: 600,
    alt: "مربی در پیاده‌رو با سگی که روی دو پا ایستاده تمرین می‌کند",
  },
} as const;
