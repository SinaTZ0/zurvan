import type { Decorator, Preview } from "@storybook/react-vite";

import { DirectionProvider } from "~/components/ui/direction";
import { TooltipProvider } from "~/components/ui/tooltip";

import "../app/app.css";

/*===== Document =====*/
// Mirror root.tsx so stories render RTL, in Persian, with the app font.
document.documentElement.lang = "fa";
document.documentElement.dir = "rtl";
// The app has one theme; `dark` switches on the variants the components are written with, portals included.
document.documentElement.classList.add("dark");

/*===== Decorators =====*/
// Base UI reads direction from context, not the `dir` attribute (see root.tsx).
const withProviders: Decorator = (Story) => (
  <DirectionProvider direction="rtl">
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  </DirectionProvider>
);

/*===== Preview =====*/
const preview: Preview = {
  decorators: [withProviders],
  parameters: {
    layout: "padded",
    controls: { expanded: true },
  },
};

export default preview;
