/*===== Types =====*/
/** The steps of the sign-in flow. Each is asked by a dog; the password step shares the phone step's welcome portrait. */
export type AuthStepName = "phone" | "password" | "code" | "name";

type AuthScene = {
  /** File stem under `public/photo/` (`<name>-900.webp` for phones, `<name>-1536.webp` from `lg`). */
  photo: string;
  alt: string;
  /** What the dog says in the bubble. */
  line: string;
  /** The crop (`object-position`): the dog's face on a phone's narrow band, the dog's half on desktop. */
  position: string;
};

/*===== Scenes =====*/
// A dedicated welcome portrait, then the home hero's other two dogs. Their heads sit a quarter in from the left and the
// right half stays dark for the form. Each crop keeps the face visible in the phone's narrow photo band.
export const AUTH_SCENES: Record<AuthStepName, AuthScene> = {
  phone: {
    photo: "auth/welcome",
    alt: "یک ژرمن‌شپرد کنار پنجره، پنجه‌هایش را روی لبه‌ی چوبی گذاشته و با سر کج به دوربین نگاه می‌کند",
    line: "سلام! شمارتو بده تا بشناسمت.",
    position: "object-[24%_30%] lg:object-[20%_40%]",
  },
  // Still at the door, only the way in differs: the same portrait, so a step change between the two doesn't fade a photo
  // into itself.
  password: {
    photo: "auth/welcome",
    alt: "یک ژرمن‌شپرد کنار پنجره، پنجه‌هایش را روی لبه‌ی چوبی گذاشته و با سر کج به دوربین نگاه می‌کند",
    line: "رمزتو بگو؛ دیگه لازم نیست منتظر پیامک بمونی.",
    position: "object-[24%_30%] lg:object-[20%_40%]",
  },
  code: {
    photo: "home/hero-2",
    alt: "یک مالینویز با قلاده‌ی چرمی، شب کنار خیابان نشسته و به دوربین نگاه می‌کند",
    line: "پیامک رسید؟ کد پنج‌رقمی رو بگو.",
    position: "object-[8%_50%] lg:object-[0%_4%]",
  },
  name: {
    photo: "home/hero-3",
    alt: "یک توله گلدن رتریور کنار در خانه دراز کشیده و قلاده‌اش را به دهان گرفته",
    line: "حالا اسمتو بگو، می‌خوام صدات کنم.",
    position: "object-[4%_50%] lg:object-[0%_35%]",
  },
};

/** The steps in the order they come. */
export const AUTH_STEP_NAMES = Object.keys(AUTH_SCENES) as AuthStepName[];

/** One step per distinct photo, so a photo two steps share is in the page once. */
export const AUTH_PHOTO_STEP_NAMES = AUTH_STEP_NAMES.filter(
  (name, index) => AUTH_STEP_NAMES.findIndex((other) => AUTH_SCENES[other].photo === AUTH_SCENES[name].photo) === index,
);

/** Whether the step is shown over the welcome portrait, whose bubble sits beside the dog's muzzle on a phone. */
export function isWelcomePortrait(step: AuthStepName): boolean {
  return AUTH_SCENES[step].photo === AUTH_SCENES.phone.photo;
}
