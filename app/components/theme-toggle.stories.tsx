import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeToggle } from "~/components/theme-toggle";

/*===== Meta =====*/
// Clicking changes the real document theme, like in the app. The toolbar theme resets it.
const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Default: Story = {};
