/**
 * The one day-arithmetic helper the dashboard needs. Four files carried their
 * own `MILLISECONDS_PER_DAY`, and two carried the same subtraction under two
 * names — `ageInDays` for the "Lange offen" view, `daysBetween` for the "vor
 * n Tagen" line under a row's date.
 */

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Days since the Unix epoch of a date's local calendar day, ignoring its clock
 * time. `Date.UTC` knows no daylight-saving change, so every calendar day is
 * exactly 24 hours long here.
 */
function localCalendarDay(date: Date): number {
  return (
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
    MILLISECONDS_PER_DAY
  );
}

/**
 * Calendar days between the local date of an ISO timestamp and the local date
 * of a reference date, in the browser's time zone. The clock time does not
 * count: an Application from yesterday at 21:56 reads as one day old at 11:50
 * today. A daylight-saving change in between does not shift the count. Never
 * negative: an Application stamped in the future — a clock skew, not a real
 * case — reads as "Heute" rather than as a negative age.
 */
export function daysSince(timestamp: string, now: Date): number {
  return Math.max(
    0,
    localCalendarDay(now) - localCalendarDay(new Date(timestamp)),
  );
}
