import { businessDayKey, businessDayStart } from "@/lib/business-time";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns the Monday 00:00 KST through the following Monday 00:00 KST. */
export function currentMagazineWeek(now = new Date()) {
  const todayStart = businessDayStart(now);
  const [year, month, day] = businessDayKey(todayStart).split("-").map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  const start = new Date(todayStart.getTime() - daysSinceMonday * DAY_MS);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  return { start, end };
}
