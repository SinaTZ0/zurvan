import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowLeftIcon, CalendarIcon, PlusIcon } from "lucide-react";

import { Button } from "~/components/ui/button";

/*===== Meta =====*/
const meta = {
  title: "UI/Button",
  component: Button,
  args: { children: "رزرو ویزیت" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>رزرو ویزیت</Button>
      <Button {...args} variant="outline">
        مشاهده پرونده
      </Button>
      <Button {...args} variant="secondary">
        تغییر زمان
      </Button>
      <Button {...args} variant="ghost">
        انصراف
      </Button>
      <Button {...args} variant="destructive">
        لغو سفارش
      </Button>
      <Button {...args} variant="link">
        قوانین و شرایط
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="xs">
        کوچک‌تر
      </Button>
      <Button {...args} size="sm">
        کوچک
      </Button>
      <Button {...args} size="default">
        پیش‌فرض
      </Button>
      <Button {...args} size="lg">
        بزرگ
      </Button>
    </div>
  ),
};

// `lg` is the full-width primary action at the bottom of a flow.
export const PrimaryAction: Story = {
  render: (args) => (
    <div className="max-w-sm">
      <Button {...args} size="lg" className="w-full">
        تأیید و ادامه
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>
        <CalendarIcon data-icon="inline-start" />
        انتخاب زمان
      </Button>
      <Button {...args} variant="outline">
        ادامه
        {/* Arrow points left: "forward" in RTL. */}
        <ArrowLeftIcon data-icon="inline-end" />
      </Button>
    </div>
  ),
};

export const IconSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((size) => (
        <Button key={size} size={size} variant="outline" aria-label="افزودن">
          <PlusIcon />
        </Button>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
