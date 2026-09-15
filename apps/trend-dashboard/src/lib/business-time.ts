/**
 * Canonical business-day timezone for this app. Every "what day is this
 * observation/collection for" decision (Market periodDate, business-date
 * grouping/comparison, and Korean-facing date display) must derive from
 * THIS constant via Intl, never from the host/container's own timezone
 * (`Date.setHours`, `process.env.TZ`, or `Date.getDate()`/`getMonth()`
 * local-time assumptions) and never from a UTC-calendar-day shortcut like
 * `.toISOString().slice(0, 10)`. Those all happen to produce the right
 * answer today only because the current dev host's OS timezone is
 * Asia/Seoul - a cloud host defaulting to UTC would silently shift every
 * business-day boundary by 9 hours. See docs/CURRENT_STATE.md's periodDate
 * timezone audit for the full trace this hardening resolves.
 */
export const BUSINESS_TIME_ZONE = "Asia/Seoul";

const businessDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const businessWallClockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BUSINESS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

function partsMap(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return map;
}

const MINUTE_MS = 60_000;

/**
 * BUSINESS_TIME_ZONE's offset from UTC at `date`, in milliseconds (positive
 * = ahead of UTC - e.g. +9h for Asia/Seoul), derived via Intl rather than
 * hardcoded - self-verifying against whatever the ICU timezone database
 * actually says for Asia/Seoul, instead of encoding an assumption about
 * Korea's timezone history as a magic number.
 *
 * `Intl.DateTimeFormat.formatToParts` has no sub-second resolution, so
 * reconstructing `date`'s wall-clock time as a UTC instant and diffing
 * against `date` itself leaks `date`'s own sub-second component into the
 * raw result as noise (up to ~1000ms). Real-world IANA zone offsets are
 * always whole-minute; rounding to the nearest minute discards that
 * formatting-precision noise without ever being able to mask a genuine
 * partial-minute offset (none exist).
 */
function businessOffsetMs(date: Date): number {
  const wall = partsMap(businessWallClockFormatter.formatToParts(date));
  const asUtc = Date.UTC(Number(wall.year), Number(wall.month) - 1, Number(wall.day), Number(wall.hour), Number(wall.minute), Number(wall.second));
  const rawOffsetMs = asUtc - date.getTime();
  return Math.round(rawOffsetMs / MINUTE_MS) * MINUTE_MS;
}

function businessYmd(date: Date): { year: number; month: number; day: number } {
  const parts = partsMap(businessDateFormatter.formatToParts(date));
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/**
 * The UTC instant corresponding to 00:00:00 in BUSINESS_TIME_ZONE on the
 * calendar day `date` falls on when observed in BUSINESS_TIME_ZONE.
 *
 * Example: 2026-09-15T05:49:18.610Z is 2026-09-15 14:49:18 in Seoul, so the
 * Seoul calendar day is 2026-09-15, and this returns the UTC instant for
 * 2026-09-15 00:00 KST, which is 2026-09-14T15:00:00.000Z.
 *
 * This reproduces EXACTLY the stored-instant convention every existing
 * MarketRankingSnapshot.periodDate already uses (previously produced, by
 * coincidence of the host OS being Asia/Seoul, via each collector's own
 * `setHours(0,0,0,0)`) - it is a drop-in replacement, not a new
 * representation, so the `periodDate` uniqueness constraint keeps meaning
 * the same thing for old and new rows alike.
 */
export function businessDayStart(date: Date): Date {
  const { year, month, day } = businessYmd(date);
  const midnightAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  return new Date(midnightAsUtc - businessOffsetMs(date));
}

/**
 * "YYYY-MM-DD" as observed in BUSINESS_TIME_ZONE - the canonical
 * business-date key for grouping, equality comparison, and future
 * Archive-date lookups. Never derive this from `.toISOString().slice(0,
 * 10)` (the UTC calendar day), which disagrees with this for any instant
 * between 00:00-08:59 KST.
 */
export function businessDayKey(date: Date): string {
  const { year, month, day } = businessYmd(date);
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
