/**
 * The one thing about the sparkline a unit test can settle: whether a week is
 * charted at all. Recharts needs a measured `ResponsiveContainer`, which jsdom
 * cannot give it, so the curve itself is verified in a browser (issue #39) and
 * the shape of its input by `applicationsAsOf`. What is left here is the
 * switch a backend with no history turns on.
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Sparkline } from './sparkline';

const LABELS = ['Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo', 'Di'];

/**
 * Queried by attribute rather than through a role: the chart is decoration
 * next to a number a Staff member can already read, so it is `aria-hidden`
 * and no accessible query reaches it.
 */
function renderSparkline(data: number[]): HTMLElement {
  const { container } = render(
    <Sparkline
      id="trend"
      type="bar"
      color="var(--color-trend-neutral)"
      data={data}
      labels={LABELS}
    />,
  );

  const chart = container.querySelector<HTMLElement>(
    '[data-sparkline="trend"]',
  );
  expect(chart).not.toBeNull();
  return chart as HTMLElement;
}

describe('Sparkline', () => {
  it('draws one baseline instead of a chart when the whole week is zero', () => {
    const chart = renderSparkline([0, 0, 0, 0, 0, 0, 0]);

    // A bar chart draws nothing at all for zero-height bars and an area chart
    // draws its line on the bottom edge in the card's own colour, so the two
    // types disagree about the same honest answer (issue #53).
    expect(chart).toHaveAttribute('data-flat', 'true');
    expect(chart.querySelector('.recharts-responsive-container')).toBeNull();
  });

  it('charts a week that left zero at any point', () => {
    const chart = renderSparkline([0, 0, 1, 0, 0, 0, 0]);

    expect(chart).not.toHaveAttribute('data-flat');
    expect(
      chart.querySelector('.recharts-responsive-container'),
    ).not.toBeNull();
  });

  it('keeps the weekday labels either way, so the seven days stay readable', () => {
    const chart = renderSparkline([0, 0, 0, 0, 0, 0, 0]);

    for (const label of LABELS) {
      expect(chart.textContent).toContain(label);
    }
  });
});
