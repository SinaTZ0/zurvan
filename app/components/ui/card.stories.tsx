import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "~/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

/*===== Meta =====*/
const meta = {
  title: "UI/Card",
  component: Card,
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
  },
  args: { size: "default" },
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>یادآوری‌های لئو</CardTitle>
        <CardDescription>واکسن سالانه (چندگانه)</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            مشاهده پرونده
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>سه‌شنبه ۲۹ اردیبهشت ۱۴۰۴، ۵ روز دیگر</CardContent>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const Small: Story = {
  args: { size: "sm" },
};

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args} className="max-w-sm">
      <CardHeader>
        <CardTitle>ویزیت در منزل</CardTitle>
        <CardDescription>دامپزشک به محل شما می‌آید</CardDescription>
      </CardHeader>
      <CardContent>از ۱.۲ میلیون تومان</CardContent>
      <CardFooter>
        <Button className="w-full">رزرو ویزیت</Button>
      </CardFooter>
    </Card>
  ),
};
