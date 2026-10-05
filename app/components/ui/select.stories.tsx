import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

/*===== Data =====*/
const species = [
  { value: "dog", label: "سگ" },
  { value: "cat", label: "گربه" },
  { value: "bird", label: "پرنده" },
  { value: "fish", label: "ماهی" },
  { value: "other", label: "سایر" },
];

/*===== Meta =====*/
const meta = {
  title: "UI/Select",
  component: SelectTrigger,
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
  },
  args: { size: "default" },
  render: (args) => (
    <Select items={species}>
      <SelectTrigger {...args} className="w-full max-w-sm" aria-label="گونه حیوان">
        <SelectValue placeholder="گونه حیوان" />
      </SelectTrigger>
      <SelectContent>
        {species.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
} satisfies Meta<typeof SelectTrigger>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Playground: Story = {};

export const Small: Story = {
  args: { size: "sm" },
};

export const Grouped: Story = {
  render: (args) => (
    <Select items={species}>
      <SelectTrigger {...args} className="w-full max-w-sm" aria-label="گونه حیوان">
        <SelectValue placeholder="گونه حیوان" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>رایج</SelectLabel>
          {species.slice(0, 2).map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>سایر گونه‌ها</SelectLabel>
          {species.slice(2).map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};

export const Disabled: Story = {
  args: { disabled: true },
};
