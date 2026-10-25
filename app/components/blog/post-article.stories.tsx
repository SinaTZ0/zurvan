import type { Meta, StoryObj } from "@storybook/react-vite";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { useState } from "react";

import { PostArticle } from "~/components/blog/post-article";
import { SAMPLE_POST, SAMPLE_SHORT_POST } from "~/components/blog/sample-post";

/*===== Meta =====*/
// The article template the post page and the Admin's preview share, with clearly fake sample posts. The article's links
// need a router, so each story renders as the only route of an in-memory router.
const meta = {
  title: "Blog/PostArticle",
  component: PostArticle,
  args: { post: SAMPLE_POST },
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <StoryRouter story={Story} />],
} satisfies Meta<typeof PostArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Router =====*/
function StoryRouter({ story: Story }: { story: React.ComponentType }) {
  const [router] = useState(() =>
    createRouter({
      // Created once (the state initializer), so the story is not remounted on render.
      // oxlint-disable-next-line react/no-unstable-nested-components
      routeTree: createRootRoute({ component: () => <Story /> }),
      history: createMemoryHistory({ initialEntries: ["/blog/sample-post"] }),
    }),
  );
  return <RouterProvider router={router} />;
}

/*===== Stories =====*/
/** Every block type, three sections (so the contents list shows) and a related course. */
export const Full: Story = {};

/** No H2s (no contents list) and no related course (the free evaluation closes it). */
export const ShortWithoutCourse: Story = { args: { post: SAMPLE_SHORT_POST } };

/** The Admin's preview: the same article, but no link in it leaves the page. */
export const Preview: Story = { args: { preview: true } };
