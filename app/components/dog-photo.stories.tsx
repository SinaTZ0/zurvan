import type { Meta, StoryObj } from "@storybook/react-vite";

import { DogPhoto } from "~/components/dog-photo";
import type { Media } from "~/orpc/media/contract";

/*===== Fixtures =====*/
// A tiny inline stand-in for the 16 px WebP placeholder, so the story shows it without any network.
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='12'><rect width='16' height='12' fill='#a58a52'/><rect width='8' height='6' fill='#6b5a35'/></svg>`,
  );

const dogMedia: Media = {
  id: "00000000-0000-4000-8000-000000000000",
  kind: "dog",
  width: 1280,
  height: 854,
  placeholder: PLACEHOLDER,
  urls: {
    thumb: "/demo/species-dog.jpg",
    card: "/demo/species-dog.jpg",
    full: "/demo/species-dog.jpg",
  },
};

/*===== Meta =====*/
const meta = {
  title: "Account/DogPhoto",
  component: DogPhoto,
  args: {
    name: "لئو",
    photo: dogMedia,
    microchipNumber: "982000412345678",
    className: "aspect-4/3 w-full rounded-3xl",
  },
  argTypes: {
    variant: { control: "select", options: ["thumb", "card", "full"] },
  },
  render: (args) => (
    <div className="max-w-md">
      <DogPhoto {...args} />
    </div>
  ),
} satisfies Meta<typeof DogPhoto>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const WithPhoto: Story = {};

/** Without a photo the flat tag sits centred on a sunken box. */
export const WithoutPhoto: Story = { args: { photo: null } };

export const Thumb: Story = { args: { className: "size-24 rounded-2xl", variant: "thumb" } };
