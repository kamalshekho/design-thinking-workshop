/**
 * The one day-arithmetic helper the dashboard needs. Four files carried their
 * own `MILLISECONDS_PER_DAY`, and two carried the same subtraction under two
 * names — `ageInDays` for the "Lange offen" view, `daysBetween` for the "vor
 * n Tagen" line under a row's date.
 */

export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole days between an ISO timestamp and a reference date. Never negative:
 * an Application stamped in the future — a clock skew, not a real case — reads
 * as "Heute" rather than as a negative age.
 */
export function daysSince(timestamp: string, now: Date): number {
  return Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(timestamp).getTime()) / MILLISECONDS_PER_DAY,
    ),
  );
}
