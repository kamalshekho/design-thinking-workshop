/**
 * Clone path: `components/application/table/table.tsx`. Kept as-is apart from
 * dropping `TableRowActionsDropdown`, which pulled in the clone's
 * `base/dropdown` for a row menu this dashboard does not show.
 */

import {
  ArrowDown,
  ChevronSelectorVertical,
  HelpCircle,
} from '@untitledui/icons';
import type {
  ComponentPropsWithRef,
  HTMLAttributes,
  ReactNode,
  Ref,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { createContext, isValidElement, useContext } from 'react';
import type {
  CellProps as AriaCellProps,
  ColumnProps as AriaColumnProps,
  RowProps as AriaRowProps,
  TableHeaderProps as AriaTableHeaderProps,
  TableProps as AriaTableProps,
} from 'react-aria-components';
import {
  Cell as AriaCell,
  Collection as AriaCollection,
  Column as AriaColumn,
  Group as AriaGroup,
  Row as AriaRow,
  Table as AriaTable,
  TableBody as AriaTableBody,
  TableHeader as AriaTableHeader,
  useTableOptions,
} from 'react-aria-components';

import { Badge } from '@/components/base/badges/badges';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Tooltip, TooltipTrigger } from '@/components/base/tooltip/tooltip';
import { cx } from '@/utils/cx';

/*
 * The clone's `TableRowActionsDropdown` — a three-item "Edit / Copy link /
 * Delete" menu — is not part of this copy: every screen renders its own
 * `rowActions` icon buttons instead, and keeping the dropdown here was what
 * pulled `base/dropdown` and `base/radio-buttons` into the application.
 */

const TableContext = createContext<{ size: 'sm' | 'md' }>({ size: 'md' });

const TableCardRoot = ({
  children,
  className,
  size = 'md',
  ...props
}: HTMLAttributes<HTMLDivElement> & { size?: 'sm' | 'md' }) => {
  return (
    <TableContext.Provider value={{ size }}>
      <div
        {...props}
        className={cx(
          'bg-primary ring-secondary overflow-hidden rounded-xl ring-1',
          className,
        )}
      >
        {children}
      </div>
    </TableContext.Provider>
  );
};

interface TableCardHeaderProps {
  /** The title of the table card header. */
  title: string;
  /** The badge displayed next to the title. */
  badge?: ReactNode;
  /** The description of the table card header. */
  description?: string;
  /** The content displayed after the title and badge. */
  contentTrailing?: ReactNode;
  /** The class name of the table card header. */
  className?: string;
}

const TableCardHeader = ({
  title,
  badge,
  description,
  contentTrailing,
  className,
}: TableCardHeaderProps) => {
  const { size } = useContext(TableContext);

  return (
    <div
      className={cx(
        'border-secondary bg-primary relative flex flex-col items-start gap-4 border-b px-4 md:flex-row',
        size === 'sm' ? 'py-4 md:px-5' : 'py-5 md:px-6',
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-md text-primary font-semibold">{title}</h2>
          {badge ? (
            isValidElement(badge) ? (
              badge
            ) : (
              <Badge color="gray" size="sm" type="modern">
                {badge}
              </Badge>
            )
          ) : null}
        </div>
        {description && <p className="text-tertiary text-sm">{description}</p>}
      </div>
      {contentTrailing}
    </div>
  );
};

interface TableRootProps
  extends
    AriaTableProps,
    Omit<ComponentPropsWithRef<'table'>, 'className' | 'slot' | 'style'> {
  size?: 'sm' | 'md';
}

const TableRoot = ({ className, size = 'md', ...props }: TableRootProps) => {
  const context = useContext(TableContext);

  return (
    <TableContext.Provider value={{ size: context?.size ?? size }}>
      <div className="overflow-x-auto">
        <AriaTable
          className={(state) =>
            cx(
              'w-full overflow-x-hidden',
              typeof className === 'function' ? className(state) : className,
            )
          }
          {...props}
        />
      </div>
    </TableContext.Provider>
  );
};
TableRoot.displayName = 'Table';

interface TableHeaderProps<T extends object>
  extends
    AriaTableHeaderProps<T>,
    Omit<
      ComponentPropsWithRef<'thead'>,
      'children' | 'className' | 'slot' | 'style'
    > {
  bordered?: boolean;
  size?: 'sm' | 'md';
}

const TableHeader = <T extends object>({
  columns,
  children,
  bordered = true,
  className,
  size: sizeProp,
  ...props
}: TableHeaderProps<T>) => {
  const context = useContext(TableContext);
  const { selectionBehavior, selectionMode } = useTableOptions();

  const size = sizeProp ?? context.size;

  return (
    <AriaTableHeader
      {...props}
      className={(state) =>
        cx(
          'bg-secondary relative',
          size === 'sm' ? 'h-9' : 'h-11',

          // Row border—using an "after" pseudo-element to avoid the border taking up space.
          bordered &&
            '[&>tr>th]:after:bg-border-secondary [&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:focus-visible:after:bg-transparent',

          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {selectionBehavior === 'toggle' && (
        <AriaColumn
          className={cx(
            'relative py-2 pr-0 pl-4',
            size === 'sm' ? 'w-9 md:pl-5' : 'w-11 md:pl-6',
          )}
        >
          {selectionMode === 'multiple' && (
            <div className="flex items-start">
              <Checkbox slot="selection" size="sm" />
            </div>
          )}
        </AriaColumn>
      )}
      <AriaCollection items={columns}>{children}</AriaCollection>
    </AriaTableHeader>
  );
};

TableHeader.displayName = 'TableHeader';

interface TableHeadProps
  extends
    AriaColumnProps,
    Omit<
      ThHTMLAttributes<HTMLTableCellElement>,
      'children' | 'className' | 'style' | 'id'
    > {
  label?: string;
  tooltip?: string;
}

const TableHead = ({
  className,
  tooltip,
  label,
  children,
  ...props
}: TableHeadProps) => {
  const { selectionBehavior } = useTableOptions();

  return (
    <AriaColumn
      {...props}
      className={(state) =>
        cx(
          'focus-visible:ring-focus-ring focus-visible:ring-offset-bg-primary relative p-0 px-4 py-2 outline-hidden focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-inset',
          selectionBehavior === 'toggle' && 'nth-2:pl-3',
          state.allowsSorting && 'cursor-pointer',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {(state) => (
        <AriaGroup className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            {label && (
              <span className="text-tertiary text-xs font-medium whitespace-nowrap">
                {label}
              </span>
            )}
            {typeof children === 'function' ? children(state) : children}
          </div>

          {tooltip && (
            <Tooltip title={tooltip} placement="top">
              <TooltipTrigger className="text-fg-quaternary hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover cursor-pointer transition duration-100 ease-linear">
                <HelpCircle className="size-4" />
              </TooltipTrigger>
            </Tooltip>
          )}

          {state.allowsSorting &&
            (state.sortDirection ? (
              <ArrowDown
                className={cx(
                  'text-fg-quaternary size-3 stroke-[1.5px]',
                  state.sortDirection === 'ascending' && 'rotate-180',
                )}
              />
            ) : (
              <ChevronSelectorVertical
                size={12}
                strokeWidth={1.5}
                className="text-fg-quaternary"
              />
            ))}
        </AriaGroup>
      )}
    </AriaColumn>
  );
};
TableHead.displayName = 'TableHead';

interface TableRowProps<T extends object>
  extends
    AriaRowProps<T>,
    Omit<
      ComponentPropsWithRef<'tr'>,
      'children' | 'className' | 'onClick' | 'slot' | 'style' | 'id'
    > {
  highlightSelectedRow?: boolean;
  size?: 'sm' | 'md';
}

const TableRow = <T extends object>({
  columns,
  children,
  className,
  highlightSelectedRow = true,
  size: sizeProp,
  ...props
}: TableRowProps<T>) => {
  const context = useContext(TableContext);
  const { selectionBehavior } = useTableOptions();

  const size = sizeProp ?? context.size;

  return (
    <AriaRow
      {...props}
      className={(state) =>
        cx(
          'outline-focus-ring hover:bg-bg-row-hover relative transition-colors duration-150 after:pointer-events-none focus-visible:outline-2 focus-visible:-outline-offset-2',
          size === 'sm' ? 'h-13' : 'h-14',
          highlightSelectedRow && 'data-selected:bg-bg-selected',

          // Row border—using an "after" pseudo-element to avoid the border taking up space.
          '[&>td]:after:bg-border-subtle [&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full last:[&>td]:after:hidden [&>td]:focus-visible:after:opacity-0 focus-visible:[&>td]:after:opacity-0',

          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {selectionBehavior === 'toggle' && (
        <AriaCell
          className={cx(
            'relative py-2 pr-0 pl-4',
            size === 'sm' ? 'md:pl-5' : 'md:pl-6',
          )}
        >
          <div className="flex items-end">
            <Checkbox slot="selection" size="sm" />
          </div>
        </AriaCell>
      )}
      <AriaCollection items={columns}>{children}</AriaCollection>
    </AriaRow>
  );
};

TableRow.displayName = 'TableRow';

interface TableCellProps
  extends
    AriaCellProps,
    Omit<
      TdHTMLAttributes<HTMLTableCellElement>,
      'children' | 'className' | 'style' | 'id'
    > {
  ref?: Ref<HTMLTableCellElement>;
  size?: 'sm' | 'md';
}

const TableCell = ({
  className,
  children,
  size: sizeProp,
  ...props
}: TableCellProps) => {
  const context = useContext(TableContext);
  const { selectionBehavior } = useTableOptions();

  const size = sizeProp ?? context.size;

  return (
    <AriaCell
      {...props}
      className={(state) =>
        cx(
          'text-secondary outline-focus-ring relative text-sm focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2',
          size === 'sm' && 'px-4 py-2',
          size === 'md' && 'px-4 py-2',

          selectionBehavior === 'toggle' && 'nth-2:pl-3',

          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {children}
    </AriaCell>
  );
};
TableCell.displayName = 'TableCell';

const TableCard = {
  Root: TableCardRoot,
  Header: TableCardHeader,
};

const Table = TableRoot as typeof TableRoot & {
  Body: typeof AriaTableBody;
  Cell: typeof TableCell;
  Head: typeof TableHead;
  Header: typeof TableHeader;
  Row: typeof TableRow;
};
Table.Body = AriaTableBody;
Table.Cell = TableCell;
Table.Head = TableHead;
Table.Header = TableHeader;
Table.Row = TableRow;

export { Table, TableCard };
