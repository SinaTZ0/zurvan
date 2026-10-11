import type { Meta, StoryObj } from "@storybook/react-vite";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { ENROLLMENT_STATUSES } from "~/orpc/enrollment/constants";

/*===== Meta =====*/
const meta = {
  title: "Components/EnrollmentStatusBadge",
  component: EnrollmentStatusBadge,
  args: { status: "active" },
  argTypes: { status: { control: "select", options: ENROLLMENT_STATUSES } },
} satisfies Meta<typeof EnrollmentStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {ENROLLMENT_STATUSES.map((status) => (
        <EnrollmentStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
