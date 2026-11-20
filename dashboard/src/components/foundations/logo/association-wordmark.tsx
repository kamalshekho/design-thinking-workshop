import { de } from '@/content/de';
import ibhLogo from '@/images/ibh-logo.png';
import { cx } from '@/utils/cx';

/**
 * Stands in for the clone's `UntitledLogo` in the copied navigation.
 */
export const AssociationWordmark = ({
  className,
  isCollapsed = false,
}: {
  className?: string;
  /** Whether to show the compact association mark. */
  isCollapsed?: boolean;
}) => (
  <span
    className={cx(
      'relative block h-8 w-32 overflow-hidden transition-[width] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
      isCollapsed && 'lg:w-8',
      className,
    )}
  >
    <img
      src={ibhLogo}
      alt={de.association}
      className={cx(
        'absolute inset-y-0 left-0 h-8 w-auto object-contain transition-opacity duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        isCollapsed && 'lg:opacity-0',
      )}
    />
    <img
      src="/Rectangle.png"
      alt=""
      aria-hidden="true"
      className={cx(
        'absolute inset-y-0 left-0 size-8 object-contain opacity-0 transition-opacity duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none',
        isCollapsed && 'lg:opacity-100',
      )}
    />
  </span>
);
