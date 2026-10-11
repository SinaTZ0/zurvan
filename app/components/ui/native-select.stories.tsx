import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "~/components/ui/input";
import { NativeSelect, NativeSelectOption } from "~/components/ui/native-select";

/*===== Meta =====*/
const meta = {
  title: "UI/NativeSelect",
  component: NativeSelect,
  args: { "aria-label": "ماه تولد", className: "w-full" },
  argTypes: { size: { control: "inline-radio", options: ["default", "sm"] } },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="">ماه</NativeSelectOption>
      <NativeSelectOption value="1">فروردین</NativeSelectOption>
      <NativeSelectOption value="2">اردیبهشت</NativeSelectOption>
      <NativeSelectOption value="3">خرداد</NativeSelectOption>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

/** Same height, surface and text size as `Input`, so they line up in a form row. */
export const BesideAnInput: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-2">
      <Input aria-label="وزن" placeholder="وزن" />
      <NativeSelect {...args}>
        <NativeSelectOption value="">ماه</NativeSelectOption>
        <NativeSelectOption value="1">فروردین</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
};

export const Invalid: Story = { args: { "aria-invalid": true } };
