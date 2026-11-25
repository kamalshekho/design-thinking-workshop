import { describe, expect, it } from 'vitest';

import { daysSince } from './dates';

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

  it('reads both ends of the 25-hour autumn day as the same day', () => {
    const now = new Date(2026, 9, 25, 23, 50);

    expect(daysSince(localTimestamp(2026, 9, 25, 0, 10), now)).toBe(0);
  });

  it('counts one day from the evening before the autumn change to the morning after', () => {
    const now = new Date(2026, 9, 25, 8, 0);

    expect(daysSince(localTimestamp(2026, 9, 24, 23, 0), now)).toBe(1);
  });

  it('counts one day across the spring change, 23.5 hours in Berlin', () => {
    const now = new Date(2026, 2, 29, 3, 0);

    expect(daysSince(localTimestamp(2026, 2, 28, 2, 30), now)).toBe(1);
  });
});
