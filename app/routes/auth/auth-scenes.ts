/*===== Types =====*/
/** The three steps of the sign-in flow; each one is asked by a different dog. */
export type AuthStepName = "phone" | "code" | "name";

type AuthScene = {
  /** File stem in `public/photo/home/` (`<name>-900.webp` for phones, `<name>-1536.webp` from `lg`). */
  photo: string;
  alt: string;
  /** What the dog says in the bubble. */
  line: string;
  /** The crop (`object-position`): the dog's face on a phone's narrow band, the dog's half on desktop. */
  position: string;
};

/*===== Scenes =====*/
// The home hero's three photos, one per step. They are composed alike (the dog's head a quarter in from the left, the
// right half dark), so the form fits the dark half and the bubble's tail points back at the dog on every one. The crops
// are tuned per photo, as in `home-hero.tsx`.
export const AUTH_SCENES: Record<AuthStepName, AuthScene> = {
  phone: {
    photo: "hero",
    alt: "یک ژرمن‌شپرد روی مبل چرمی دراز کشیده و مستقیم به دوربین نگاه می‌کند",
    line: "سلام! شمارتو بده تا بشناسمت.",
    position: "object-[24%_30%] lg:object-[20%_40%]",
  },
  code: {
    photo: "hero-2",
    alt: "یک مالینویز با قلاده‌ی چرمی، شب کنار خیابان نشسته و به دوربین نگاه می‌کند",
    line: "پیامک رسید؟ کد پنج‌رقمی رو بگو.",
    position: "object-[8%_50%] lg:object-[0%_4%]",
  },
  name: {
    photo: "hero-3",
    alt: "یک توله گلدن رتریور کنار در خانه دراز کشیده و قلاده‌اش را به دهان گرفته",
    line: "حالا اسمتو بگو، می‌خوام صدات کنم.",
    position: "object-[4%_50%] lg:object-[0%_35%]",
  },
};

/** The steps in the order they come. */
export const AUTH_STEP_NAMES = Object.keys(AUTH_SCENES) as AuthStepName[];
