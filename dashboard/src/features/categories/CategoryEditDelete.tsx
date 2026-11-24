/**
 * The icon buttons on a Category, in the table from 768 px and on the cards
 * below it. Each layout sizes and colours its own buttons; the markup, the
 * edit and delete wording, and the rule that a Category still named by an
 * Application cannot be deleted are the same in both.
 */

import { Edit01, Trash01 } from '@untitledui/icons';
import type { ComponentType } from 'react';

import { de } from '@/content/de';
import type { Category } from '@/domain/category';

export type CategoryActionButtonProps = {
  icon: ComponentType<{ className?: string }>;
  /** The accessible name; the visible `title` is the short version of it. */
  label: string;
  title: string;
  isDisabled?: boolean;
  destructive?: boolean;
  onClick: () => void;
};

/** An icon-only button: `label` is its accessible name, `title` its hint. */
export function CategoryIconButton({
  icon: Icon,
  label,
  title,
  isDisabled,
  onClick,
  className,
  iconClassName,
}: Omit<CategoryActionButtonProps, 'destructive'> & {
  className: string;
  iconClassName: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={isDisabled}
      onClick={onClick}
      className={className}
    >
      <Icon className={iconClassName} />
    </button>
  );
}

type CategoryEditDeleteProps = {
  category: Category;
  /** How many Applications still name the Category; any blocks the delete. */
  blocking: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  button: ComponentType<CategoryActionButtonProps>;
};

export function CategoryEditDelete({
  category,
  blocking,
  onEdit,
  onDelete,
  button: ActionButton,
}: CategoryEditDeleteProps) {
  return (
    <>
      <ActionButton
        icon={Edit01}
        label={de.categories.editOne(category.name)}
        title={de.categories.edit}
        onClick={() => {
          onEdit(category);
        }}
      />
      <ActionButton
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
    </>
  );
}
