import type { Meta, StoryObj } from "@storybook/react-vite";

import { EvaluationStatusBadge } from "~/components/evaluation-status-badge";
import { EVALUATION_STATUSES } from "~/orpc/evaluation/constants";

/*===== Meta =====*/
const meta = {
  title: "Components/EvaluationStatusBadge",
  component: EvaluationStatusBadge,
  args: { status: "requested" },
  argTypes: { status: { control: "select", options: EVALUATION_STATUSES } },
} satisfies Meta<typeof EvaluationStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {EVALUATION_STATUSES.map((status) => (
        <EvaluationStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
