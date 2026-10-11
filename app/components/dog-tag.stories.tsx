import type { Meta, StoryObj } from "@storybook/react-vite";

import { DogTag } from "~/components/dog-tag";

/*===== Meta =====*/
const meta = {
  title: "Account/DogTag",
  component: DogTag,
  args: { name: "لئو", microchipNumber: "982000412345678", size: "md", finish: "engraved" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    finish: { control: "inline-radio", options: ["engraved", "leaf"] },
  },
} satisfies Meta<typeof DogTag>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const Finishes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-8">
      <DogTag {...args} finish="engraved" />
      <DogTag {...args} finish="leaf" />
      <DogTag {...args} size="lg" finish="leaf" />
      <DogTag {...args} size="sm" />
    </div>
  ),
};

export const LongNames: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-8">
      <DogTag {...args} name="پسته" microchipNumber={null} />
      <DogTag {...args} name="شاهزاده مکس" />
      <DogTag {...args} name="بارون فون وایس‌هاوزن سوم" finish="leaf" />
    </div>
  ),
};
