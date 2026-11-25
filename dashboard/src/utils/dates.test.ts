import { describe, expect, it } from 'vitest';

import { daysSince } from './dates';

/**
 * Both dates are built from local time, because the answer depends on the
 * local date and Vitest pins no time zone. Every case gives the same result
 * under `TZ=UTC` and `TZ=Europe/Berlin`.
 */
const NOW = new Date(2026, 8, 5, 12, 0);

function localTimestamp(...parts: [number, number, number, number, number]) {
  return new Date(...parts).toISOString();
}

describe('daysSince', () => {
  it('counts seven calendar days since the Application arrived', () => {
    expect(daysSince(localTimestamp(2026, 7, 29, 12, 0), NOW)).toBe(7);
  });

  it('reports nothing for an Application that arrived today', () => {
    expect(daysSince(localTimestamp(2026, 8, 5, 8, 0), NOW)).toBe(0);
  });

  it('reports nothing for a timestamp ahead of the reference date', () => {
    expect(daysSince(localTimestamp(2026, 8, 6, 8, 0), NOW)).toBe(0);
  });

  it('counts yesterday evening as one day, though fewer than 24 hours passed', () => {
    const now = new Date(2026, 10, 25, 11, 50);

    expect(daysSince(localTimestamp(2026, 10, 24, 21, 56), now)).toBe(1);
  });

  it('counts the 25-hour day of the autumn change as one calendar day', () => {
    const now = new Date(2026, 9, 25, 23, 50);

    expect(daysSince(localTimestamp(2026, 9, 25, 0, 10), now)).toBe(0);
  });

  it('counts the night after the autumn change as one day', () => {
    const now = new Date(2026, 9, 26, 8, 0);

    expect(daysSince(localTimestamp(2026, 9, 25, 23, 0), now)).toBe(1);
  });

  it('counts the 23-hour day of the spring change as one day', () => {
    const now = new Date(2026, 2, 29, 0, 15);

    expect(daysSince(localTimestamp(2026, 2, 28, 0, 30), now)).toBe(1);
  });
});
