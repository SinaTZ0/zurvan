import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionCard } from "~/components/session-card";
import type { TrainingSession } from "~/orpc/enrollment/contract";

/*===== Sample Sessions =====*/
const DAY_MS = 86_400_000;

function session(days: number, status: TrainingSession["status"]): TrainingSession {
  return {
    id: `session-${days}`,
    startsAt: new Date(Date.now() + days * DAY_MS),
    durationMinutes: 60,
    placeKind: "home",
    place: "تهران، ونک",
    status,
    trainerNote: null,
  };
}

/** CGC under way: three held, one missed, two scheduled, six still to plan. */
const underWay = [
  session(-26, "held"),
  session(-19, "held"),
  session(-12, "missed"),
  session(-5, "held"),
  session(2, "scheduled"),
  session(9, "scheduled"),
];

/*===== Meta =====*/
const meta = {
  title: "Components/SessionCard",
  component: SessionCard,
  args: {
    plannedSessions: 12,
    sessions: underWay,
    size: "full",
    caption: "۴ از ۱۲ جلسه استفاده شده. جلسه‌ی بعد: دوشنبه، ساعت ۱۷:۰۰",
  },
  argTypes: { size: { control: "inline-radio", options: ["strip", "full"] } },
  decorators: [
    (Story) => (
      <div className="max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SessionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/*===== Stories =====*/
export const Full: Story = {};

export const Strip: Story = { args: { size: "strip", caption: undefined } };

/** In the cancel dialog: the boxes the refund is counted on. */
export const UnheldHighlighted: Story = { args: { highlightUnheld: true } };

/** Paid, nothing scheduled yet. */
export const Waiting: Story = {
  args: { sessions: [], plannedSessions: 10, caption: "آرمان برای اولین جلسه تماس می‌گیرد." },
};

/** A test: one box. */
export const Test: Story = { args: { sessions: [session(-3, "held")], plannedSessions: 1, caption: undefined } };
