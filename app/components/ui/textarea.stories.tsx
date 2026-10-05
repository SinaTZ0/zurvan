import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

/*===== Meta =====*/
const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: {
    placeholder: "مثال: آموزش دستورات پایه، کنترل پارس، اجتماعی شدن...",
    "aria-label": "شرح کوتاه مشکل یا درخواست",
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor="request">شرح کوتاه مشکل یا درخواست</Label>
      <Textarea {...args} id="request" aria-label={undefined} />
    </div>
  ),
};

export const Filled: Story = {
  args: {
    defaultValue: "طی دو روز اخیر اشتهاش کم شده و چند بار استفراغ داشته.",
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
