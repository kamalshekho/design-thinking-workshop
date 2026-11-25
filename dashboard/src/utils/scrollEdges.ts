type HorizontalScroll = Pick<
  HTMLElement,
  'scrollLeft' | 'clientWidth' | 'scrollWidth'
>;

type ScrollEdges = {
  /** Content is hidden past the left edge. */
  start: boolean;
  /** Content is hidden past the right edge. */
  end: boolean;
};

/**
 * Browsers report `scrollLeft` in fractions of a pixel under page zoom, so a
 * strip scrolled all the way can stop half a pixel short of its width.
 */
const SUBPIXEL_TOLERANCE = 1;

/** Which edges of a horizontally scrolling element hide content. */
export function scrollEdges({
  scrollLeft,
  clientWidth,
  scrollWidth,
}: HorizontalScroll): ScrollEdges {
  return {
    start: scrollLeft > SUBPIXEL_TOLERANCE,
    end: scrollLeft + clientWidth < scrollWidth - SUBPIXEL_TOLERANCE,
  };
}
