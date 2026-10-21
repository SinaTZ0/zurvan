import type { SmsMessage } from "~/orpc/sms/contract";
import { tehranDay } from "~/routes/admin_sms/dates";

/*===== Types =====*/
/** The messages of one Tehran day on the current page, newest first. */
export type SmsDay = { day: string; messages: SmsMessage[] };

/*===== Group by Day =====*/
/** Splits a page of the outbox (newest first) into runs of the same Tehran day, keeping the server's order. */
export function groupByDay(messages: readonly SmsMessage[]): SmsDay[] {
  const days: SmsDay[] = [];

  for (const message of messages) {
    const day = tehranDay(message.createdAt);
    const last = days.at(-1);
    if (last?.day === day) last.messages.push(message);
    else days.push({ day, messages: [message] });
  }

  return days;
}
