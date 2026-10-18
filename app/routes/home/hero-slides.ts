/*===== Hero Slides =====*/
// Three dogs greet the visitor, each with its own line in the bubble. Every photo is composed the same way (the dog's
// head a quarter in from the left, the right half dark), so the headline and the bubble's tail fit them all. `position`
// is the crop: the dog's face on a phone's narrow band, the dog's half on desktop. The lines are the owner-approved ones;
// new lines go to the morning review first (docs/overnight/03-DECISIONS-NEEDED.md), never straight to the page.
export const HERO_SLIDES = [
  {
    name: "hero",
    alt: "یک ژرمن‌شپرد روی مبل چرمی دراز کشیده و مستقیم به دوربین نگاه می‌کند",
    line: "سلام! من اینجام که زندگی من و تو با هم بهتر بشه :)",
    position: "object-[24%_30%] lg:object-[20%_40%]",
  },
  {
    name: "hero-2",
    alt: "یک مالینویز با قلاده‌ی چرمی، شب کنار خیابان نشسته و به دوربین نگاه می‌کند",
    line: "توی خیابون هم حواسم فقط به توئه.",
    position: "object-[8%_50%] lg:object-[0%_4%]",
  },
  {
    name: "hero-3",
    alt: "یک توله گلدن رتریور کنار در خانه دراز کشیده و قلاده‌اش را به دهان گرفته",
    line: "قلاده‌مو آوردم! بریم تمرین؟",
    position: "object-[4%_50%] lg:object-[0%_35%]",
  },
] as const;
