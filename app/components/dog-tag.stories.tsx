import type { Meta, StoryObj } from "@storybook/react-vite";

import { DogTag } from "~/components/dog-tag";

/*===== Meta =====*/
const meta = {
  title: "Account/DogTag",
  component: DogTag,
  args: { name: "لئو", microchipNumber: "982000412345678", size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "portrait", "md", "lg"] },
  },
} satisfies Meta<typeof DogTag>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-8">
      <DogTag {...args} size="sm" />
      <DogTag {...args} size="portrait" />
      <DogTag {...args} size="md" />
      <DogTag {...args} size="lg" />
    </div>
  ),
};

export const LongNames: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-8">
      <DogTag {...args} name="پسته" microchipNumber={null} />
      <DogTag {...args} name="شاهزاده مکس" />
      <DogTag {...args} name="بارون فون وایس‌هاوزن سوم" />
    </div>
  ),
};
