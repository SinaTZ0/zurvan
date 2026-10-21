import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRoutesStub } from "react-router";

import { NotFoundPage } from "~/components/not-found-page";
import { RulesArticle } from "~/routes/rules/components/rules-article";
import { SAMPLE_RULES } from "~/routes/rules/sample-rules";

/*===== Meta =====*/
// The rules page isn't published (`SITE_RULES` is `null`), so this is how it will look: the sample is clearly fake text.
// The page's links need a router, so each story renders inside a routes stub.
const meta = {
  title: "Routes/Rules",
  component: RulesArticle,
  args: { rules: SAMPLE_RULES },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => {
      const Stub = createRoutesStub([{ path: "/", Component: Story }]);
      return <Stub />;
    },
  ],
} satisfies Meta<typeof RulesArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
/** The published page with eight sections of mixed length. */
export const Published: Story = {};

/** What `/rules` and every unknown address show today. */
export const NotFound: Story = {
  render: () => <NotFoundPage />,
};
