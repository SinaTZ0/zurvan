import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlanSlip } from "~/components/plan-slip";

/*===== Meta =====*/
const meta = {
  title: "Components/PlanSlip",
  component: PlanSlip,
  args: {
    plan: {
      sessions: 8,
      price: 120_000_000,
      note: "پستچی را بیشتر از همه می‌ترسد. اول دو جلسه فقط با خودش کار می‌کنیم، بعد صاحبش را اضافه می‌کنیم.",
    },
    daysLeft: 7,
    deadline: "شنبه ۲۶ مهر ساعت ۱۷:۰۰",
    signer: "آرمان",
  },
  decorators: [
    (Story) => (
      <div className="max-w-md p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlanSlip>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Fresh: Story = {};

export const ThreeDaysLeft: Story = { args: { daysLeft: 3 } };

export const LastDay: Story = { args: { daysLeft: 1 } };

export const Expired: Story = { args: { daysLeft: 0, muted: true } };

/** The trainer's preview before anything is typed. */
export const Empty: Story = {
  args: { plan: { sessions: null, price: null, note: "" }, daysLeft: null, deadline: null },
};

export const Compact: Story = { args: { compact: true } };
