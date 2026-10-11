import type { Meta, StoryObj } from "@storybook/react-vite";

import { AssessmentStatusBadge } from "~/components/assessment-status-badge";
import { ASSESSMENT_STATUSES } from "~/orpc/assessment/constants";

/*===== Meta =====*/
const meta = {
  title: "Components/AssessmentStatusBadge",
  component: AssessmentStatusBadge,
  args: { status: "booked" },
  argTypes: { status: { control: "select", options: ASSESSMENT_STATUSES } },
} satisfies Meta<typeof AssessmentStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ASSESSMENT_STATUSES.map((status) => (
        <AssessmentStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
