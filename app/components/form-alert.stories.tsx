import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormAlert } from "~/components/form-alert";

/*===== Meta =====*/
const meta = {
  title: "Components/FormAlert",
  component: FormAlert,
  args: { message: "ایمیل یا رمز عبور درست نیست." },
  render: (args) => (
    <div className="max-w-sm">
      <FormAlert {...args} />
    </div>
  ),
} satisfies Meta<typeof FormAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Default: Story = {};

export const LongMessage: Story = {
  args: { message: "درخواست انجام نشد. اتصال اینترنت را بررسی کنید و دوباره امتحان کنید." },
};
