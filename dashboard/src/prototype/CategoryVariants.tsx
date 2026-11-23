/**
 * PROTOTYPE (issue #109), throwaway. Two narrow shapes for the Kategorien
 * table:
 *
 * - `CategoryCards` (variant B, below 768 px): every action of the table,
 *   moved into a card per Category with 40 px buttons;
 * - `CategoryListDeskOnly` (variant C, below 1024 px): only the switch and
 *   the edit dialog. Moving and deleting stay at the desk (`A29`).
 */

import { ArrowDown, ArrowUp, Edit01, Trash01 } from '@untitledui/icons';
import type { ComponentType, ReactNode } from 'react';

import { Toggle } from '@/components/base/toggle/toggle';
import { de } from '@/content/de';
import type { Category } from '@/domain/category';
import { cx } from '@/utils/cx';

export type CategoryVariantProps = {
  categories: readonly Category[];
  usage: ReadonlyMap<string, number>;
  namedBy: ReadonlyMap<string, number>;
  allCategories: readonly Category[];
  canReorder: boolean;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category, active: boolean) => void;
  onMove: (category: Category, direction: -1 | 1) => void;
  emptyState: ReactNode;
};

function Heading({ shown, total }: { shown: number; total: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-primary text-base font-semibold">
        {de.categories.tableTitle}
      </h2>
      <span className="text-tertiary text-xs">
        {de.categories.count(shown, total)}
      </span>
    </div>
  );
}

function NameButton({
  category,
  onEdit,
}: {
  category: Category;
  onEdit: (category: Category) => void;
}) {
  return (
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
  );
}

function BigIconButton({
  icon: Icon,
  label,
  isDisabled,
  destructive,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  isDisabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isDisabled}
      onClick={onClick}
      className={cx(
        'border-secondary text-fg-secondary outline-focus-ring flex size-10 cursor-pointer items-center justify-center rounded-lg border focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-35',
        destructive && 'text-fg-error-primary',
      )}
    >
      <Icon className="size-4.5" />
    </button>
  );
}

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
}: CategoryVariantProps) {
  if (categories.length === 0) {
    return <div className="bg-primary rounded-xl border">{emptyState}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading shown={categories.length} total={allCategories.length} />
      <ul className="flex flex-col gap-2.5">
        {categories.map((category) => {
          const position = allCategories.findIndex((c) => c.id === category.id);
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
                <NameButton category={category} onEdit={onEdit} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-7">
                <label className="flex items-center gap-2.5 text-sm">
                  <Toggle
                    isSelected={category.active}
                    aria-label={de.categories.toggleOne(category.name)}
                    onChange={(active) => {
                      onToggleActive(category, active);
                    }}
                  />
                  <span className="text-secondary">
                    {category.active
                      ? de.categories.active
                      : de.categories.inactive}
                  </span>
                </label>
                <span className="text-tertiary text-sm tabular-nums">
                  {de.categories.usageCount(usage.get(category.id) ?? 0)}
                </span>
              </div>
              <div className="border-secondary flex items-center gap-2 border-t pt-3 pl-7">
                <BigIconButton
                  icon={ArrowUp}
                  label={de.categories.moveUpOne(category.name)}
                  isDisabled={!canReorder || position <= 0}
                  onClick={() => {
                    onMove(category, -1);
                  }}
                />
                <BigIconButton
                  icon={ArrowDown}
                  label={de.categories.moveDownOne(category.name)}
                  isDisabled={
                    !canReorder || position === allCategories.length - 1
                  }
                  onClick={() => {
                    onMove(category, 1);
                  }}
                />
                <span className="flex-1" />
                <BigIconButton
                  icon={Edit01}
                  label={de.categories.editOne(category.name)}
                  onClick={() => {
                    onEdit(category);
                  }}
                />
                <BigIconButton
                  icon={Trash01}
                  label={
                    blocking > 0
                      ? de.categories.deleteBlocked(blocking)
                      : de.categories.deleteOne(category.name)
                  }
                  isDisabled={blocking > 0}
                  destructive
                  onClick={() => {
                    onDelete(category);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CategoryListDeskOnly({
  categories,
  allCategories,
  onEdit,
  onToggleActive,
  emptyState,
}: CategoryVariantProps) {
  if (categories.length === 0) {
    return <div className="bg-primary border-y">{emptyState}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Heading shown={categories.length} total={allCategories.length} />
      <ul className="border-secondary bg-primary divide-secondary -mx-4 divide-y border-y sm:mx-0 sm:rounded-xl sm:border">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center gap-3 px-4 py-3">
            <NameButton category={category} onEdit={onEdit} />
            <Toggle
              isSelected={category.active}
              aria-label={de.categories.toggleOne(category.name)}
              onChange={(active) => {
                onToggleActive(category, active);
              }}
            />
          </li>
        ))}
      </ul>
      <p className="text-tertiary text-sm">
        Reihenfolge ändern und Kategorien löschen geht ab 1024 px Breite.
      </p>
    </div>
  );
}
