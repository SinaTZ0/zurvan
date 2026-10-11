import { HEAD_TRAINER } from "~/lib/head-trainer";
import { utcToTehranParts, WEEKDAY_NAMES, formatSlotDay } from "~/lib/tehran-time";
import type { Assessment } from "~/orpc/assessment/contract";

/** The day name and the date of a slot apart («شنبه», «۱۹ مهر»), for the slip's time block. */
export function splitSlotDay(date: Date): { weekday: string; date: string } {
  const weekday = WEEKDAY_NAMES[utcToTehranParts(date).weekday];
  return { weekday, date: formatSlotDay(date).slice(weekday.length).trim() };
}

/** What the customer calls the trainer: the head trainer by first name, anyone else by the name on the profile. */
export function trainerShortName(trainer: Assessment["trainer"]): string {
  return trainer.isHeadTrainer ? HEAD_TRAINER.firstName : trainer.name;
}
