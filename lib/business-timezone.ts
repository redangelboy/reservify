import { DateTime } from "luxon";

/**
 * US Central Time (CST in winter, CDT in summer).
 * Set NEXT_PUBLIC_BUSINESS_TIMEZONE or BUSINESS_TIMEZONE to override (IANA name).
 */
export const BUSINESS_TIMEZONE =
  (typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || process.env.BUSINESS_TIMEZONE)) ||
  "America/Chicago";

/** JS weekday 0=Sun..6=Sat for the calendar YYYY-MM-DD in business timezone. */
export function parseYmdToJsDayOfWeek(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(mo) || Number.isNaN(d)) return 0;
  const dt = DateTime.fromObject({ year: y, month: mo, day: d }, { zone: BUSINESS_TIMEZONE }).startOf("day");
  if (!dt.isValid) return 0;
  const w = dt.weekday;
  return w === 7 ? 0 : w;
}

/** UTC instant for wall-clock HH:mm on YYYY-MM-DD in business timezone. */
export function utcFromYmdAndTime(ymd: string, hhmm: string): Date {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, m] = hhmm.split(":").map(Number);
  if ([y, mo, d, h, m].some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid date/time: ${ymd} ${hhmm}`);
  }
  const dt = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: h, minute: m, second: 0, millisecond: 0 },
    { zone: BUSINESS_TIMEZONE }
  );
  if (!dt.isValid) throw new Error(`Invalid zoned datetime: ${ymd} ${hhmm}`);
  return dt.toJSDate();
}

/** Start/end of that calendar day in business timezone, as UTC Date for DB queries. */
export function businessDayUtcRange(ymd: string): { start: Date; end: Date } {
  const [y, mo, d] = ymd.split("-").map(Number);
  const start = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: 0, minute: 0, second: 0, millisecond: 0 },
    { zone: BUSINESS_TIMEZONE }
  ).startOf("day");
  const end = start.endOf("day");
  return { start: start.toJSDate(), end: end.toJSDate() };
}
