/**
 * Clone path: `components/application/pagination/pagination-base.tsx`. Changes
 * from the clone:
 * - a page button's accessible name comes from `content/de.ts` rather than the
 *   clone's English `Page n` literal;
 * - derives `pages` with `useMemo` instead of `useState` + `useEffect`;
 * - renders `<button type="button">` without `role="listitem"` (list items are
 *   wrapped in `<li>` by `pagination.tsx`);
 * - exports individual named components instead of a compound `Pagination`
 *   object.
 *
 * The pager variants built on this live in `pagination.tsx`.
 *
 * Cut: the render-prop and `asChild` branches of `PaginationItem`, as the one
 * pager here renders a plain page button. Prop comments that only restate the
 * prop name are dropped too.
 */

import type { CSSProperties, FC, HTMLAttributes, ReactNode } from 'react';
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
} from 'react';

import { de } from '@/content/de';

type PaginationPage = {
  type: 'page';
  value: number;
  isCurrent: boolean;
};

type PaginationEllipsisType = {
  type: 'ellipsis';
  key: number;
};

type PaginationItemType = PaginationPage | PaginationEllipsisType;

interface PaginationContextType {
  pages: PaginationItemType[];
  currentPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

const PaginationContext = createContext<PaginationContextType | undefined>(
  undefined,
);

export interface PaginationRootProps {
  /** Number of sibling pages to show on each side of the current page */
  siblingCount?: number;
  page: number;
  total: number;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onPageChange?: (page: number) => void;
}

export const PaginationRoot = ({
  total,
  siblingCount = 1,
  page,
  onPageChange,
  children,
  style,
  className,
}: PaginationRootProps) => {
  const pages = useMemo((): PaginationItemType[] => {
    const items: PaginationItemType[] = [];
    // Calculate the maximum number of pagination elements (pages, potential ellipsis, first and last) to show
    const totalPageNumbers = siblingCount * 2 + 5;

    // If the total number of items to show is greater than or equal to the total pages,
    // we can simply list all pages without needing to collapse with ellipsis
    if (totalPageNumbers >= total) {
      for (let i = 1; i <= total; i++) {
        items.push({
          type: 'page',
          value: i,
          isCurrent: i === page,
        });
      }
    } else {
      // Calculate left and right sibling boundaries around the current page
      const leftSiblingIndex = Math.max(page - siblingCount, 1);
      const rightSiblingIndex = Math.min(page + siblingCount, total);

      // Determine if we need to show ellipsis on either side
      const showLeftEllipsis = leftSiblingIndex > 2;
      const showRightEllipsis = rightSiblingIndex < total - 1;

      // Case 1: No left ellipsis, but right ellipsis is needed
      if (!showLeftEllipsis && showRightEllipsis) {
        // Calculate how many page numbers to show starting from the beginning
        const leftItemCount = siblingCount * 2 + 3;
        const leftRange = range(1, leftItemCount);

        leftRange.forEach((pageNum) =>
          items.push({
            type: 'page',
            value: pageNum,
            isCurrent: pageNum === page,
          }),
        );

        // Insert ellipsis after the left range and add the last page
        items.push({ type: 'ellipsis', key: leftItemCount + 1 });
        items.push({
          type: 'page',
          value: total,
          isCurrent: total === page,
        });
      }
      // Case 2: Left ellipsis needed, but right ellipsis is not needed
      else if (showLeftEllipsis && !showRightEllipsis) {
        // Determine how many items from the end should be shown
        const rightItemCount = siblingCount * 2 + 3;
        const rightRange = range(total - rightItemCount + 1, total);

        // Always show the first page, then add an ellipsis to indicate skipped pages
        items.push({
          type: 'page',
          value: 1,
          isCurrent: page === 1,
        });
        items.push({ type: 'ellipsis', key: total - rightItemCount });
        rightRange.forEach((pageNum) =>
          items.push({
            type: 'page',
            value: pageNum,
            isCurrent: pageNum === page,
          }),
        );
      }
      // Case 3: Both left and right ellipsis are needed
      else if (showLeftEllipsis && showRightEllipsis) {
        // Always show the first page
        items.push({
          type: 'page',
          value: 1,
          isCurrent: page === 1,
        });
        // Insert left ellipsis after the first page
        items.push({ type: 'ellipsis', key: leftSiblingIndex - 1 });

        // Show a range of pages around the current page
        const middleRange = range(leftSiblingIndex, rightSiblingIndex);
        middleRange.forEach((pageNum) =>
          items.push({
            type: 'page',
            value: pageNum,
            isCurrent: pageNum === page,
          }),
        );

        // Insert right ellipsis and finally the last page
        items.push({ type: 'ellipsis', key: rightSiblingIndex + 1 });
        items.push({
          type: 'page',
          value: total,
          isCurrent: total === page,
        });
      }
    }

    return items;
  }, [total, siblingCount, page]);

  const onPageChangeHandler = (newPage: number) => {
    onPageChange?.(newPage);
  };

  const paginationContextValue: PaginationContextType = {
    pages,
    currentPage: page,
    total,
    onPageChange: onPageChangeHandler,
  };

  return (
    <PaginationContext.Provider value={paginationContextValue}>
      <nav
        aria-label="Pagination Navigation"
        style={style}
        className={className}
      >
        {children}
      </nav>
    </PaginationContext.Provider>
  );
};

/**
 * Creates an array of numbers from start to end.
 * @param start - The start number.
 * @param end - The end number.
 * @returns An array of numbers from start to end.
 */
const range = (start: number, end: number): number[] => {
  const length = end - start + 1;

  return Array.from({ length }, (_, index) => index + start);
};

interface TriggerRenderProps {
  isDisabled: boolean;
  onClick: () => void;
}

type TriggerChildProps = HTMLAttributes<HTMLElement> & {
  disabled?: boolean;
  isDisabled?: boolean;
};

interface TriggerProps {
  /** The children of the trigger. Can be a render prop or a valid element. */
  children: ReactNode | ((props: TriggerRenderProps) => ReactNode);
  /** The style of the trigger. */
  style?: CSSProperties;
  /** The class name of the trigger. */
  className?: string | ((args: { isDisabled: boolean }) => string);
  /** If true, the child element will be cloned and passed down the prop of the trigger. */
  asChild?: boolean;
  /** The direction of the trigger. */
  direction: 'prev' | 'next';
  /** The aria label of the trigger. */
  ariaLabel?: string;
}

const Trigger: FC<TriggerProps> = ({
  children,
  style,
  className,
  asChild = false,
  direction,
  ariaLabel,
}) => {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error(
      'Pagination components must be used within a Pagination.Root',
    );
  }

  const { currentPage, total, onPageChange } = context;

  const isDisabled =
    direction === 'prev' ? currentPage <= 1 : currentPage >= total;

  const handleClick = () => {
    if (isDisabled) return;

    const newPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;
    onPageChange(newPage);
  };

  const computedClassName =
    typeof className === 'function' ? className({ isDisabled }) : className;

  const defaultAriaLabel = direction === 'prev' ? 'Previous Page' : 'Next Page';

  // If the children is a render prop, we need to pass the isDisabled and onClick to the render prop.
  if (typeof children === 'function') {
    return <>{children({ isDisabled, onClick: handleClick })}</>;
  }

  // If the children is a valid element, we need to clone it and pass the isDisabled and onClick to the cloned element.
  if (asChild && isValidElement<TriggerChildProps>(children)) {
    return cloneElement(children, {
      onClick: handleClick,
      disabled: isDisabled,
      isDisabled,
      'aria-label': ariaLabel || defaultAriaLabel,
      style: {
        ...children.props.style,
        ...style,
      },
      className:
        [computedClassName, children.props.className]
          .filter(Boolean)
          .join(' ') || undefined,
    });
  }

  return (
    <button
      aria-label={ariaLabel || defaultAriaLabel}
      onClick={handleClick}
      disabled={isDisabled}
      style={style}
      className={computedClassName}
    >
      {children}
    </button>
  );
};

export const PaginationPrevTrigger: FC<Omit<TriggerProps, 'direction'>> = (
  props,
) => <Trigger {...props} direction="prev" />;

export const PaginationNextTrigger: FC<Omit<TriggerProps, 'direction'>> = (
  props,
) => <Trigger {...props} direction="next" />;

interface PaginationItemProps {
  value: number;
  isCurrent: boolean;
  children?: ReactNode;
  /** The style object of the pagination item. */
  style?: CSSProperties;
  /** The class name of the pagination item. */
  className?: string | ((args: { isSelected: boolean }) => string);
  /** The aria label of the pagination item. */
  ariaLabel?: string;
}

export const PaginationItem = ({
  value,
  isCurrent,
  children,
  style,
  className,
  ariaLabel,
}: PaginationItemProps) => {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error(
      'Pagination components must be used within a <PaginationRoot />',
    );
  }

  const { onPageChange } = context;

  const isSelected = isCurrent;

  const handleClick = () => {
    onPageChange(value);
  };

  const computedClassName =
    typeof className === 'function' ? className({ isSelected }) : className;

  return (
    <button
      type="button"
      onClick={handleClick}
      style={style}
      className={computedClassName}
      aria-current={isCurrent ? 'page' : undefined}
      aria-label={ariaLabel || de.pagination.page(value)}
    >
      {children}
    </button>
  );
};
interface PaginationEllipsisProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string | (() => string);
}

export const PaginationEllipsis: FC<PaginationEllipsisProps> = ({
  children,
  style,
  className,
}) => {
  const computedClassName =
    typeof className === 'function' ? className() : className;

  return (
    <span style={style} className={computedClassName} aria-hidden="true">
      {children}
    </span>
  );
};

interface PaginationContextComponentProps {
  children: (pagination: PaginationContextType) => ReactNode;
}

export const PaginationContextComponent: FC<
  PaginationContextComponentProps
> = ({ children }) => {
  const context = useContext(PaginationContext);
  if (!context) {
    throw new Error(
      'Pagination components must be used within a PaginationRoot',
    );
  }

  return <>{children(context)}</>;
};
