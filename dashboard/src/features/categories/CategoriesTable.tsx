/**
 * The Categories list, in the same table card Anfragen uses — same card, same
 * row height, same header treatment — so the two screens read as one product.
 *
 * Three things are deliberately different from `ApplicationTable`:
 *
 * - no sorting. The order of the rows *is* the order of the form (`A12`), so
 *   a click on a column heading would show a list that no longer matches what
 *   an Applicant sees. Reordering happens through the arrows in the first
 *   column instead;
 * - no selection column. Deleting Categories in bulk has no use here — the
 *   list is four rows long, and a Category with Applications behind it cannot
 *   be deleted at all (`A15`);
 * - the row is not clickable. Each row carries a switch and two icon buttons;
 *   a fourth, invisible click target under them would be a guess.
 */

import { ArrowDown, ArrowUp, Edit01, Trash01 } from '@untitledui/icons';
import type { ComponentType, ReactNode } from 'react';

import { Table, TableCard } from '@/components/application/table/table';
import { Toggle } from '@/components/base/toggle/toggle';
import { de } from '@/content/de';
import type { Category } from '@/domain/category';
import { cx } from '@/utils/cx';

type CategoriesTableProps = {
  /** The Categories to render, already filtered by the screen. */
  categories: readonly Category[];
  /** Applications per Category id for the usage column, discarded ones excluded. */
  usage: ReadonlyMap<string, number>;
  /**
   * Applications naming each Category id, discarded ones **included** — the
   * delete guard only (`API.md`: `applicationCount` excludes them,
   * `deletable` does not). A discarded Application still needs its Category's
   * name for the day it is restored (`A15`).
   */
  namedBy: ReadonlyMap<string, number>;
  /**
   * Position and neighbours are read from the full list, so a filtered view
   * still numbers its rows the way the form orders them.
   */
  allCategories: readonly Category[];
  /**
   * Reordering needs every row on screen; a search or a tab hides part of the
   * list, and swapping with a neighbour nobody can see is a move a Staff
   * member cannot predict.
   */
  canReorder: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category, active: boolean) => void;
  onMove: (category: Category, direction: -1 | 1) => void;
  /** Rendered inside the card when `categories` is empty. */
  emptyState: ReactNode;
};

/** The widest usage bar, so the column compares Categories against each other. */
function maxUsage(usage: ReadonlyMap<string, number>): number {
  return Math.max(1, ...usage.values());
}

export function CategoriesTable({
  categories,
  usage,
  namedBy,
  allCategories,
  canReorder,
  onEdit,
  onDelete,
  onToggleActive,
  onMove,
  emptyState,
}: CategoriesTableProps) {
  const scale = maxUsage(usage);

  return (
    <TableCard.Root>
      <TableCard.Header
        title={de.categories.tableTitle}
        description={de.categories.tableDescription}
        badge={de.categories.count(categories.length, allCategories.length)}
      />

      <Table aria-label={de.categories.title}>
        <Table.Header>
          <Table.Head id="order" label={de.categories.columns.order} />
          <Table.Head
            id="name"
            label={de.categories.columns.name}
            isRowHeader
            className="w-full max-w-full md:min-w-64"
          />
          <Table.Head id="status" label={de.categories.columns.status} />
          <Table.Head id="usage" label={de.categories.columns.usage} />
          <Table.Head id="actions" aria-label={de.categories.columns.actions} />
        </Table.Header>

        {/*
         * `dependencies` is not optional here. React Aria caches a rendered
         * row against its item, so a row whose `Category` object has not
         * changed keeps the closure it was first built with — and the
         * position, the usage bar and the disabled state of the arrows are
         * all read from outside the item. Without this, switching to Aktiv
         * would leave the arrows enabled.
         */}
        <Table.Body
          items={categories}
          dependencies={[allCategories, usage, namedBy, canReorder]}
          renderEmptyState={() => emptyState}
        >
          {(category) => {
            const position = allCategories.findIndex(
              (candidate) => candidate.id === category.id,
            );
            const isFirst = position <= 0;
            const isLast = position === allCategories.length - 1;
            const count = usage.get(category.id) ?? 0;
            /** What blocks deletion; not what the column shows. */
            const blocking = namedBy.get(category.id) ?? 0;

            return (
              <Table.Row id={category.id}>
                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <span className="text-quaternary w-5 text-xs tabular-nums">
                      {position + 1}
                    </span>
                    <MoveButton
                      icon={ArrowUp}
                      label={de.categories.moveUpOne(category.name)}
                      isDisabled={!canReorder || isFirst}
                      title={
                        canReorder
                          ? de.categories.moveUp
                          : de.categories.moveBlocked
                      }
                      onClick={() => {
                        onMove(category, -1);
                      }}
                    />
                    <MoveButton
                      icon={ArrowDown}
                      label={de.categories.moveDownOne(category.name)}
                      isDisabled={!canReorder || isLast}
                      title={
                        canReorder
                          ? de.categories.moveDown
                          : de.categories.moveBlocked
                      }
                      onClick={() => {
                        onMove(category, 1);
                      }}
                    />
                  </div>
                </Table.Cell>

                <Table.Cell>
                  {/*
                   * The name is the row's own edit affordance, so the common
                   * action needs no aim at a 16px icon at the far right.
                   */}
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(category);
                    }}
                    className="outline-focus-ring group/name -mx-1 block max-w-full cursor-pointer rounded-md px-1 py-1 text-left focus-visible:outline-2"
                  >
                    <span
                      className={cx(
                        'block text-sm font-medium underline decoration-transparent underline-offset-3 transition-colors duration-150 group-hover/name:decoration-current',
                        category.active ? 'text-primary' : 'text-tertiary',
                      )}
                    >
                      {category.name}
                    </span>
                    <span className="text-tertiary mt-0.5 block max-w-[46ch] text-xs leading-relaxed">
                      {category.description === ''
                        ? de.categories.noDescription
                        : category.description}
                    </span>
                  </button>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2.5">
                    <Toggle
                      isSelected={category.active}
                      aria-label={de.categories.toggleOne(category.name)}
                      onChange={(active) => {
                        onToggleActive(category, active);
                      }}
                    />
                    {/*
                     * The switch on its own is a colour. The word beside it is
                     * what a colour-blind reader has instead, and it follows
                     * the status badge's rule: plain text, no second highlight.
                     */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'text-sm whitespace-nowrap',
                        category.active ? 'text-secondary' : 'text-quaternary',
                      )}
                    >
                      {category.active
                        ? de.categories.active
                        : de.categories.inactive}
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex min-w-24 flex-col gap-1.5">
                    <span className="text-secondary text-sm tabular-nums">
                      {de.categories.usageCount(count)}
                    </span>
                    <span
                      aria-hidden="true"
                      className="bg-tertiary block h-1 w-20 overflow-hidden rounded-full"
                    >
                      <span
                        style={{ width: `${String((count / scale) * 100)}%` }}
                        className="bg-fuut-purple/60 block h-full rounded-full transition-[width] duration-200 ease-out"
                      />
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center justify-end gap-1">
                    <RowActionButton
                      icon={Edit01}
                      label={de.categories.editOne(category.name)}
                      title={de.categories.edit}
                      onClick={() => {
                        onEdit(category);
                      }}
                    />
                    <RowActionButton
                      icon={Trash01}
                      label={de.categories.deleteOne(category.name)}
                      title={
                        blocking > 0
                          ? de.categories.deleteBlocked(blocking)
                          : de.categories.delete
                      }
                      isDisabled={blocking > 0}
                      destructive
                      onClick={() => {
                        onDelete(category);
                      }}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table>
    </TableCard.Root>
  );
}

type IconButtonProps = {
  icon: ComponentType<{ className?: string }>;
  /** The accessible name; the visible `title` is the short version of it. */
  label: string;
  title: string;
  isDisabled?: boolean;
  onClick: () => void;
};

/**
 * The reorder arrows. Padded to a 32px box and kept in the DOM when disabled,
 * so the column never changes width as a row moves to an end of the list.
 */
function MoveButton({
  icon: Icon,
  label,
  title,
  isDisabled,
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      className="text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function RowActionButton({
  icon: Icon,
  label,
  title,
  isDisabled,
  destructive,
  onClick,
}: IconButtonProps & { destructive?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      className={cx(
        'text-fg-quaternary outline-focus-ring hover:bg-primary_hover flex size-8 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        destructive
          ? 'hover:text-fg-error-primary'
          : 'hover:text-fg-secondary_hover',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
