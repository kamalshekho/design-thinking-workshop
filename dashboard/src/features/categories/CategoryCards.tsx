/**
 * The Kategorien table below 768 px, one card per Category (issue #109). At
 * 360 px the table pushed the switch, the usage and both row actions past the
 * edge of the card. The cards keep every action the table has: the switch,
 * the reorder arrows, edit and delete, each as a 40 px button. The name still
 * opens the edit dialog, as in the table.
 *
 * Takes the table's own props, so `CategoriesTable` can hand them over as
 * they are.
 */

import { ArrowDown, ArrowUp } from '@untitledui/icons';

import { Toggle } from '@/components/base/toggle/toggle';
import { de } from '@/content/de';
import { cx } from '@/utils/cx';

import type { CategoriesTableProps } from './CategoriesTable';
import type { CategoryActionButtonProps } from './CategoryEditDelete';
import { CategoryEditDelete, CategoryIconButton } from './CategoryEditDelete';

export function CategoryCards({
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
  return (
    <section aria-label={de.categories.title} className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-primary text-base font-semibold">
          {de.categories.tableTitle}
        </h2>
        <span className="text-tertiary text-xs">
          {de.categories.count(categories.length, allCategories.length)}
        </span>
      </div>

      {categories.length === 0 ? (
        <div className="bg-primary ring-secondary rounded-xl ring-1">
          {emptyState}
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {categories.map((category) => {
            const position = allCategories.findIndex(
              (candidate) => candidate.id === category.id,
            );

            /** What blocks deletion, as in the table. */
            const blocking = namedBy.get(category.id) ?? 0;

            return (
              <li
                key={category.id}
                className="border-secondary bg-primary flex flex-col gap-3 rounded-xl border p-4 shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <span className="text-quaternary mt-0.5 w-4 text-xs tabular-nums">
                    {position + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(category);
                    }}
                    className="outline-focus-ring min-w-0 flex-1 cursor-pointer rounded-md text-left focus-visible:outline-2"
                  >
                    <span
                      className={cx(
                        'block font-medium',
                        category.active ? 'text-primary' : 'text-tertiary',
                      )}
                    >
                      {category.name}
                    </span>
                    <span className="text-tertiary mt-0.5 block text-sm leading-snug">
                      {category.description === ''
                        ? de.categories.noDescription
                        : category.description}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-7">
                  <span className="flex items-center gap-2.5 text-sm">
                    <Toggle
                      isSelected={category.active}
                      aria-label={de.categories.toggleOne(category.name)}
                      onChange={(active) => {
                        onToggleActive(category, active);
                      }}
                    />
                    <span
                      aria-hidden="true"
                      className={
                        category.active ? 'text-secondary' : 'text-quaternary'
                      }
                    >
                      {category.active
                        ? de.categories.active
                        : de.categories.inactive}
                    </span>
                  </span>
                  <span className="text-tertiary text-sm tabular-nums">
                    {de.categories.usageCount(usage.get(category.id) ?? 0)}
                  </span>
                </div>

                <div className="border-secondary flex items-center gap-2 border-t pt-3 pl-7">
                  <CardButton
                    icon={ArrowUp}
                    label={de.categories.moveUpOne(category.name)}
                    title={
                      canReorder
                        ? de.categories.moveUp
                        : de.categories.moveBlocked
                    }
                    isDisabled={!canReorder || position <= 0}
                    onClick={() => {
                      onMove(category, -1);
                    }}
                  />
                  <CardButton
                    icon={ArrowDown}
                    label={de.categories.moveDownOne(category.name)}
                    title={
                      canReorder
                        ? de.categories.moveDown
                        : de.categories.moveBlocked
                    }
                    isDisabled={
                      !canReorder || position === allCategories.length - 1
                    }
                    onClick={() => {
                      onMove(category, 1);
                    }}
                  />
                  <span className="flex-1" />
                  <CategoryEditDelete
                    category={category}
                    blocking={blocking}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    button={CardButton}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** 40 px, so a thumb hits one button and not its neighbour. */
function CardButton({ destructive, ...props }: CategoryActionButtonProps) {
  return (
    <CategoryIconButton
      {...props}
      className={cx(
        'border-secondary text-fg-secondary outline-focus-ring flex size-10 cursor-pointer items-center justify-center rounded-lg border focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-35',
        destructive && 'text-fg-error-primary',
      )}
      iconClassName="size-4.5"
    />
  );
}
