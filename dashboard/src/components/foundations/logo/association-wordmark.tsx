import { cx } from '@/utils/cx';

/**
 * Neutral placeholder standing in for the association's removed logo, per
 * the client's request to show the prototype without their visual identity.
 *
 * Two marks crossfade exactly like the image pair this replaces (see git
 * history): a wide placeholder while the sidebar is expanded, a square one
 * once it collapses.
 */
export const AssociationWordmark = ({
  className,
  isCollapsed = false,
}: {
  className?: string;
  /** Whether to show the compact placeholder mark. */
  isCollapsed?: boolean;
}) => (
  <span
    className={cx(
      'relative block h-8 w-32 overflow-hidden transition-[width] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
      isCollapsed && 'lg:w-8',
      className,
    )}
  >
    <span
      aria-label="Logo"
      data-testid="wordmark-full"
      role="img"
      className={cx(
        'absolute inset-y-0 left-0 flex h-8 w-32 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-100 text-[10px] font-medium tracking-wide text-gray-400 uppercase transition-opacity duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        isCollapsed && 'lg:opacity-0',
      )}
    >
      Logo
    </span>
    <span
      aria-hidden="true"
      data-testid="wordmark-compact"
      className={cx(
        'absolute inset-y-0 left-0 flex size-8 items-center justify-center overflow-hidden rounded border border-dashed border-gray-300 bg-gray-100 text-[8px] font-medium text-gray-400 uppercase opacity-0 transition-opacity duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        isCollapsed && 'lg:opacity-100',
      )}
    >
      Logo
    </span>
  </span>
);
