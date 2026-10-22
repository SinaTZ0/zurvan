import type { Meta, StoryObj } from "@storybook/react-vite";
import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { useState } from "react";

import { NotFoundPage } from "~/components/not-found-page";
import { RulesArticle } from "~/routes/rules/components/rules-article";
import { SAMPLE_RULES } from "~/routes/rules/sample-rules";

/*===== Meta =====*/
// The rules page isn't published (`SITE_RULES` is `null`), so this is how it will look: the sample is clearly fake text.
// The page's links need a router, so each story renders as the only route of an in-memory router at `/rules`.
const meta = {
  title: "Routes/Rules",
  component: RulesArticle,
  args: { rules: SAMPLE_RULES },
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <StoryRouter story={Story} />],
} satisfies Meta<typeof RulesArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Router =====*/
function StoryRouter({ story: Story }: { story: React.ComponentType }) {
  const [router] = useState(() =>
    createRouter({
      // Created once (the state initializer), so the story is not remounted on render.
      // oxlint-disable-next-line react/no-unstable-nested-components
      routeTree: createRootRoute({ component: () => <Story /> }),
      history: createMemoryHistory({ initialEntries: ["/rules"] }),
    }),
  );
  return <RouterProvider router={router} />;
}

/*===== Stories =====*/
/** The published page with eight sections of mixed length. */
export const Published: Story = {};

/** What `/rules` and every unknown address show today. */
export const NotFound: Story = {
  render: () => <NotFoundPage />,
};
