import { describe, expect, it } from 'vitest';

import { daysSince } from './dates';

const NOW = new Date('2026-09-05T12:00:00.000Z');

describe('daysSince', () => {
  it('counts whole days since the Application arrived', () => {
    expect(daysSince('2026-08-29T12:00:00.000Z', NOW)).toBe(7);
  });

  it('reports nothing for an Application that arrived today', () => {
    expect(daysSince('2026-09-05T08:00:00.000Z', NOW)).toBe(0);
  });

  it('reports nothing for a timestamp ahead of the reference date', () => {
    expect(daysSince('2026-09-06T08:00:00.000Z', NOW)).toBe(0);
  });
});
