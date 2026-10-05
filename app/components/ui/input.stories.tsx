import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

/*===== Meta =====*/
const meta = {
  title: "UI/Input",
  component: Input,
  args: { placeholder: "نام حیوان", "aria-label": "نام حیوان" },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="pet-name">نام حیوان</Label>
      <Input {...args} id="pet-name" aria-label={undefined} />
    </div>
  ),
};

export const Filled: Story = {
  args: { defaultValue: "لئو" },
};

// Phone numbers stay LTR inside the RTL layout.
export const Phone: Story = {
  args: {
    type: "tel",
    dir: "ltr",
    placeholder: "۰۹۱۲ ۳۴۵ ۶۷۸۹",
    "aria-label": "شماره موبایل",
  },
};

export const Invalid: Story = {
  args: { defaultValue: "۰۹۱۲", "aria-invalid": true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: "لئو" },
};
