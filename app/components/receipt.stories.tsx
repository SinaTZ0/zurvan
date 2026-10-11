import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "~/components/ui/button";
import { Receipt, ReceiptLine, ReceiptLines, ReceiptTotal } from "~/components/receipt";
import { Stamp } from "~/components/stamp";

/*===== Meta =====*/
const meta = {
  title: "Components/Receipt",
  component: Receipt,
  args: { title: "رسید", aside: "ZR-140507-0042", children: null },
  decorators: [
    (Story) => (
      <div className="max-w-md p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Receipt>;

export default meta;
type Story = StoryObj<typeof meta>;

const lines = (
  <>
    <ReceiptLines>
      <ReceiptLine label="دوره" amount={90_000_000}>
        سگ اجتماعی (CGC) برای لئو
      </ReceiptLine>
      <ReceiptLine label="پانسیون" amount={60_000_000}>
        لئو در پانسیون می‌ماند
      </ReceiptLine>
      <ReceiptLine label="تخفیف" amount={5_000_000} credit>
        MEHR1405
      </ReceiptLine>
      <ReceiptLine label="کیف پول" amount={60_000_000} credit>
        از موجودی کیف پولت
      </ReceiptLine>
    </ReceiptLines>
    <ReceiptTotal label="پرداخت آنلاین" amount={85_000_000} />
  </>
);

/*===== Stories =====*/
export const Checkout: Story = {
  args: {
    children: (
      <>
        {lines}
        <Button size="lg" className="mt-6 w-full">
          پرداخت ۸٫۵ میلیون تومان
        </Button>
      </>
    ),
  },
};

export const Paid: Story = {
  args: {
    children: (
      <>
        <Stamp lines={["پرداخت", "شد"]} />
        {lines}
      </>
    ),
  },
};

export const FillingIn: Story = {
  args: {
    children: (
      <ReceiptLines>
        <ReceiptLine label="سگ" placeholder>
          هنوز سگی انتخاب نکرده‌ای
        </ReceiptLine>
        <ReceiptLine label="دوره" amount={90_000_000}>
          سگ اجتماعی (CGC)
        </ReceiptLine>
      </ReceiptLines>
    ),
  },
};
