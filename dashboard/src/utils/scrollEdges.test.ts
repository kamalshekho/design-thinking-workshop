import { describe, expect, it } from 'vitest';

import { scrollEdges } from './scrollEdges';

describe('scrollEdges', () => {
  it('hides nothing when the content fits', () => {
    expect(
      scrollEdges({ scrollLeft: 0, clientWidth: 400, scrollWidth: 400 }),
    ).toEqual({ start: false, end: false });
  });

  it('hides the end of content wider than the element', () => {
    expect(
      scrollEdges({ scrollLeft: 0, clientWidth: 288, scrollWidth: 380 }),
    ).toEqual({ start: false, end: true });
  });

  it('hides both edges while scrolled part of the way', () => {
    expect(
      scrollEdges({ scrollLeft: 40, clientWidth: 288, scrollWidth: 380 }),
    ).toEqual({ start: true, end: true });
  });

  it('hides only the start once scrolled to the end', () => {
    expect(
      scrollEdges({ scrollLeft: 92, clientWidth: 288, scrollWidth: 380 }),
    ).toEqual({ start: true, end: false });
  });

  it('treats a scroll half a pixel short of either edge as at the edge', () => {
    expect(
      scrollEdges({ scrollLeft: 0.5, clientWidth: 288, scrollWidth: 380 }),
    ).toEqual({ start: false, end: true });

    expect(
      scrollEdges({ scrollLeft: 91.5, clientWidth: 288, scrollWidth: 380 }),
    ).toEqual({ start: true, end: false });
  });
});
