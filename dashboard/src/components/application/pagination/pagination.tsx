/**
 * Clone path: `components/application/pagination/pagination.tsx`. The clone
 * ships seven pager variants; only the card pager under `ApplicationTable` is
 * used here, so this copy keeps `PaginationCardDefault` and drops the other
 * six. That is what took the clone's `base/select`, `base/button-group` and
 * `hooks/use-resize-observer` out of this application — none of them was
 * reachable from the variant we render.
 *
 * The clone's labels are English literals in the component; this copy reads
 * them from `content/de.ts` instead, since a Staff member sees them and the
 * dashboard UI is German (`A6`).
 */

import { ArrowLeft, ArrowRight } from '@untitledui/icons';

import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { cx } from '@/utils/cx';

import type { PaginationRootProps } from './pagination-base';
import { Pagination } from './pagination-base';

interface PaginationProps extends Partial<
  Omit<PaginationRootProps, 'children'>
> {
  /** Whether the pagination buttons are rounded. */
  rounded?: boolean;
}

/**
 * `de.pagination.position` with its two placeholders filled and both numbers
 * set in medium weight, the emphasis the clone's English markup carried.
 */
const PageCounter = ({
  currentPage,
  total,
}: {
  currentPage: number;
  total: number;
}) => (
  <>
    {de.pagination.position.split(/(\{page\}|\{total\})/).map((part, index) => {
      if (part === '{page}' || part === '{total}') {
        return (
          <span key={index} className="font-medium">
            {part === '{page}' ? currentPage : total}
          </span>
        );
      }
      return part;
    })}
  </>
);

const PaginationItem = ({
  value,
  rounded,
  isCurrent,
}: {
  value: number;
  rounded?: boolean;
  isCurrent: boolean;
}) => {
  return (
    <Pagination.Item
      value={value}
      isCurrent={isCurrent}
      className={({ isSelected }) =>
        cx(
          'text-quaternary outline-focus-ring hover:bg-primary_hover hover:text-secondary focus-visible:bg-primary_hover flex size-9 cursor-pointer items-center justify-center p-3 text-sm font-medium transition duration-100 ease-linear focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2',
          rounded ? 'rounded-full' : 'rounded-lg',
          isSelected && 'bg-primary_hover text-secondary',
        )
      }
    >
      {value}
    </Pagination.Item>
  );
};

export const PaginationCardDefault = ({
  rounded,
  page = 1,
  total = 10,
  ...props
}: PaginationProps) => {
  const isDesktop = useBreakpoint('md');

  return (
    <Pagination.Root
      {...props}
      page={page}
      total={total}
      className="border-secondary flex w-full items-center justify-between gap-3 border-t px-4 py-3 md:px-6 md:pt-3 md:pb-4"
    >
      <div className="flex flex-1 justify-start">
        <Pagination.PrevTrigger asChild>
          <Button iconLeading={ArrowLeft} color="secondary" size="sm">
            {isDesktop ? de.pagination.previous : undefined}
          </Button>
        </Pagination.PrevTrigger>
      </div>

      <Pagination.Context>
        {({ pages, currentPage, total }) => (
          <>
            <div className="hidden justify-center gap-0.5 md:flex">
              {pages.map((page, index) =>
                page.type === 'page' ? (
                  <PaginationItem key={index} rounded={rounded} {...page} />
                ) : (
                  <Pagination.Ellipsis
                    key={index}
                    className="text-tertiary flex size-9 shrink-0 items-center justify-center"
                  >
                    &#8230;
                  </Pagination.Ellipsis>
                ),
              )}
            </div>

            <div className="text-fg-secondary flex justify-center text-sm whitespace-pre md:hidden">
              <PageCounter currentPage={currentPage} total={total} />
            </div>
          </>
        )}
      </Pagination.Context>

      <div className="flex flex-1 justify-end">
        <Pagination.NextTrigger asChild>
          <Button iconTrailing={ArrowRight} color="secondary" size="sm">
            {isDesktop ? de.pagination.next : undefined}
          </Button>
        </Pagination.NextTrigger>
      </div>
    </Pagination.Root>
  );
};
