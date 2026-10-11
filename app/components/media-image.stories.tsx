import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaImage } from "~/components/media-image";
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
  title: "Components/MediaImage",
  component: MediaImage,
  args: { media: dogMedia, variant: "card", alt: "لئو، ژرمن شپرد، در حال نشستن" },
  argTypes: {
    variant: { control: "select", options: ["thumb", "card", "full"] },
  },
  render: (args) => (
    <div className="max-w-sm">
      <MediaImage {...args} />
    </div>
  ),
} satisfies Meta<typeof MediaImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Card: Story = { args: { className: "w-full rounded-xl" } };

export const Thumb: Story = { args: { variant: "thumb", className: "size-20 rounded-full" } };

/** The `full` variant keeps the photo's own aspect ratio instead of cropping it. */
export const FullKeepsAspectRatio: Story = { args: { variant: "full", className: "h-auto w-full rounded-xl" } };

/** A broken URL leaves the blurred placeholder behind, so the box is never empty. */
export const PlaceholderWhileLoading: Story = {
  args: {
    media: { ...dogMedia, urls: { ...dogMedia.urls, card: "/demo/does-not-exist.jpg" } },
    className: "w-full rounded-xl",
  },
};
