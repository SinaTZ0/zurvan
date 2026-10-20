/*===== Designs =====*/
// The directions shown to the owner, in the switch's order. The URL carries the number, not the name, so a
// renamed mascot keeps its link.
export const DESIGNS = [
  { variant: "1", mascot: "رخش", kind: "سگ واقعی" },
  { variant: "2", mascot: "فندق", kind: "شخصیت کارتونی" },
  { variant: "3", mascot: "سایه", kind: "نشان گرافیکی" },
  // Fandogh again, redrawn as a storybook character that lives in the layout (the owner's pick, 2026-10-20).
  { variant: "4", mascot: "فندق نو", kind: "شخصیت قصه‌ای" },
  // Design 4 in night only, with five black-and-gold palettes to choose from (2026-10-20).
  { variant: "5", mascot: "فندق شب", kind: "شب، سیاه و طلایی" },
  // The owner's pairing from design 5 (neutral black, bright yellow gold) in six styles (2026-10-20).
  { variant: "6", mascot: "فندق طلایی", kind: "مشکی خنثی و طلای زرد" },
  // Design 6's plain style, with «چه چیزی یاد می‌دهیم؟» as a pinned scroll scene (2026-10-20).
  { variant: "7", mascot: "فندق اسکرول", kind: "روایت با اسکرول" },
] as const;

export type DesignVariant = (typeof DESIGNS)[number]["variant"];

export function isDesignVariant(value: string | undefined): value is DesignVariant {
  return DESIGNS.some((design) => design.variant === value);
}
