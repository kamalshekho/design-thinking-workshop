/**
 * Add and edit one Category, in a modal over Kategorien.
 *
 * A modal rather than a second screen or an inline row editor: the form has
 * three fields, and the list behind it is the context a Staff member needs
 * while typing — a Category is defined against the ones already there
 * (`A12`). React Aria's `Modal` owns the focus trap, the Escape key and the
 * `aria-modal` semantics; the styling is this application's, assembled from
 * `base/` primitives the way `README.md` describes.
 *
 * The preview under the fields is the Applicant's side of the same data: what
 * the form will render once this is saved. It exists because the person
 * editing never sees the form, so nothing else in the dashboard shows the
 * consequence of the wording they are choosing.
 */

import { Tag01, XClose } from '@untitledui/icons';
import { useId, useState } from 'react';
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Toggle } from '@/components/base/toggle/toggle';
import { de } from '@/content/de';
import type { Category } from '@/domain/category';
import {
  CATEGORY_DESCRIPTION_MAX_LENGTH,
  CATEGORY_NAME_MAX_LENGTH,
  isCategoryNameTaken,
} from '@/domain/category';
import { cx } from '@/utils/cx';

/** Everything a Category carries except its id, which the screen assigns. */
export type CategoryDraft = Omit<Category, 'id'>;

type CategoryDialogProps = {
  /** The Category being edited, or `null` while adding a new one. */
  category: Category | null;
  /** The full list, so the name can be checked against the others. */
  categories: readonly Category[];
  onSubmit: (draft: CategoryDraft) => void;
  onClose: () => void;
};

const fieldClassName =
  'border-primary bg-primary text-primary placeholder:text-quaternary w-full rounded-lg border px-3 py-2.5 text-sm leading-relaxed transition-colors duration-150 outline-none focus:border-fuut-purple focus:ring-2 focus:ring-fuut-purple/10';

export function CategoryDialog({
  category,
  categories,
  onSubmit,
  onClose,
}: CategoryDialogProps) {
  const isEdit = category !== null;
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [active, setActive] = useState(category?.active ?? true);
  /**
   * Validation runs on submit, not on every keystroke: a name is invalid for
   * most of the time it is being typed, and flagging that as it happens is
   * noise rather than help.
   */
  const [error, setError] = useState<string | null>(null);

  const descriptionId = useId();
  const descriptionHintId = `${descriptionId}-hint`;

  const trimmedName = name.trim();
  const remaining = CATEGORY_DESCRIPTION_MAX_LENGTH - description.length;

  function submit(): void {
    if (trimmedName === '') {
      setError(de.categories.dialog.nameRequired);
      return;
    }

    if (isCategoryNameTaken(categories, trimmedName, category?.id)) {
      setError(de.categories.dialog.nameTaken);
      return;
    }

    onSubmit({ name: trimmedName, description: description.trim(), active });
  }

  return (
    <AriaModalOverlay
      isDismissable
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      className="bg-overlay/40 data-[entering]:overlay-entering data-[exiting]:overlay-exiting fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-[2px] sm:items-center"
    >
      <AriaModal className="data-[entering]:dialog-entering data-[exiting]:dialog-exiting w-full max-w-lg">
        <AriaDialog className="bg-primary ring-secondary flex max-h-[85vh] flex-col overflow-y-auto rounded-2xl shadow-lg ring-1 outline-none">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="flex flex-col gap-5 p-6"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="ring-secondary bg-secondary flex size-11 shrink-0 items-center justify-center rounded-xl ring-1"
              >
                <Tag01 className="text-fuut-purple size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <AriaHeading
                  slot="title"
                  className="text-text-primary tracking-heading text-lg font-semibold"
                >
                  {isEdit
                    ? de.categories.dialog.editTitle
                    : de.categories.dialog.createTitle}
                </AriaHeading>
                <p className="text-text-tertiary mt-1 text-sm leading-relaxed">
                  {isEdit
                    ? de.categories.dialog.editSubtitle
                    : de.categories.dialog.createSubtitle}
                </p>
              </div>

              {/* Escape and a click outside close the dialog too; this makes
                  the way out visible rather than only known. */}
              <Button
                size="sm"
                color="tertiary"
                iconLeading={XClose}
                aria-label={de.categories.dialog.close}
                onClick={onClose}
              />
            </div>

            <Input
              isRequired
              label={de.categories.dialog.name}
              placeholder={de.categories.dialog.namePlaceholder}
              value={name}
              maxLength={CATEGORY_NAME_MAX_LENGTH}
              isInvalid={error !== null}
              hint={error ?? de.categories.dialog.nameHint}
              onChange={(value) => {
                setName(value);
                setError(null);
              }}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={descriptionId}
                className="text-secondary text-sm font-medium"
              >
                {de.categories.dialog.description}
              </label>
              <textarea
                id={descriptionId}
                rows={3}
                value={description}
                maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
                placeholder={de.categories.dialog.descriptionPlaceholder}
                aria-describedby={descriptionHintId}
                onChange={(event) => {
                  setDescription(event.target.value);
                }}
                className={cx(fieldClassName, 'resize-none')}
              />
              <div
                id={descriptionHintId}
                className="text-tertiary flex justify-between gap-3 text-xs"
              >
                <span>{de.categories.dialog.descriptionHint}</span>
                <span className="tabular-nums">
                  {de.categories.dialog.remaining(remaining)}
                </span>
              </div>
            </div>

            <div className="border-secondary bg-secondary_alt flex items-start gap-3 rounded-xl border p-4">
              <Toggle
                size="md"
                isSelected={active}
                onChange={setActive}
                label={de.categories.dialog.activeLabel}
                hint={de.categories.dialog.activeHint}
              />
            </div>

            <div className="border-secondary flex flex-col gap-2 rounded-xl border border-dashed p-4">
              <p className="text-tertiary text-[11px] font-semibold tracking-[0.06em] uppercase">
                {de.categories.dialog.preview}
              </p>
              <div
                aria-hidden="true"
                className={cx(
                  'border-primary bg-primary flex items-start gap-3 rounded-lg border p-3 transition-opacity duration-150',
                  !active && 'opacity-50',
                )}
              >
                <span className="border-primary mt-0.5 size-4 shrink-0 rounded-full border-2" />
                <span className="min-w-0">
                  <span className="text-primary block truncate text-sm font-medium">
                    {trimmedName === ''
                      ? de.categories.dialog.namePlaceholder
                      : trimmedName}
                  </span>
                  {description.trim() !== '' && (
                    <span className="text-tertiary mt-0.5 block text-xs leading-relaxed">
                      {description.trim()}
                    </span>
                  )}
                </span>
              </div>
              {!active && (
                <p className="text-tertiary text-xs">
                  {de.categories.dialog.previewInactive}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button size="md" color="secondary" onClick={onClose}>
                {de.categories.dialog.cancel}
              </Button>
              <Button size="md" color="primary" type="submit">
                {isEdit
                  ? de.categories.dialog.save
                  : de.categories.dialog.create}
              </Button>
            </div>
          </form>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
