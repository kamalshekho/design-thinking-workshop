/**
 * The question a destructive action asks before it runs.
 *
 * It replaces `window.confirm`, which the four confirmations in the dashboard
 * used to go through. The browser dialog is the one surface in the application
 * that is not this application: it carries the browser's typography and the
 * operating system's button order, it renders the raw question with no room
 * for the consequence underneath it, and on the screen that erases what a
 * person wrote it looked like the least considered step of the flow. What is
 * gained here is the danger colour on the destructive button, a second line
 * for the consequence, and a wording that can name the action instead of
 * "OK".
 *
 * Assembled the way `CategoryDialog` is — React Aria owns the focus trap, the
 * Escape key and the modal semantics, the styling is this application's —
 * with three differences that follow from it asking rather than collecting:
 *
 * - `role="alertdialog"`, so a screen reader announces the question on open
 *   instead of waiting for the focused control to be read;
 * - focus lands on the dialog itself rather than on a button, which is React
 *   Aria's own behaviour for a dialog whose children do not ask for it: no
 *   answer is armed, so a stray Enter on the way here confirms nothing;
 * - Escape and a click on the backdrop cancel, which is the same escape route
 *   the browser dialog offered.
 */

import { AlertTriangle } from '@untitledui/icons';
import type { FC } from 'react';
import {
  Dialog as AriaDialog,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { cx } from '@/utils/cx';

type ConfirmDialogProps = {
  /** The question, as a question. Becomes the dialog's accessible name. */
  title: string;
  /**
   * What the action does once confirmed — the sentence the browser dialog had
   * nowhere to put. Omitted where the title already says everything.
   */
  description?: string;
  /** Names the action, never "OK": the button says what the click does. */
  confirmLabel: string;
  /**
   * Renders the confirming button in the danger colour and the header glyph
   * in the error tint. On by default: every confirmation in the dashboard is
   * asked because something is about to be taken away.
   */
  destructive?: boolean;
  /** Overrides the warning glyph where another one says more. */
  icon?: FC<{ className?: string }>;
  onConfirm: () => void;
  /** Escape, the backdrop and "Abbrechen" all arrive here. */
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = true,
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AriaModalOverlay
      isDismissable
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
      className="bg-overlay/40 data-[entering]:overlay-entering data-[exiting]:overlay-exiting fixed inset-0 z-50 flex items-end justify-center p-4 backdrop-blur-[2px] sm:items-center"
    >
      <AriaModal className="data-[entering]:dialog-entering data-[exiting]:dialog-exiting w-full max-w-md">
        <AriaDialog
          role="alertdialog"
          className="bg-primary ring-secondary flex flex-col gap-5 rounded-2xl p-6 shadow-lg ring-1 outline-none"
        >
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className={cx(
                'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1',
                destructive
                  ? 'bg-error-primary ring-utility-red-200'
                  : 'bg-secondary ring-secondary',
              )}
            >
              <Icon
                className={cx(
                  'size-5',
                  destructive ? 'text-fg-error-primary' : 'text-fuut-purple',
                )}
              />
            </span>
            <div className="min-w-0 flex-1">
              <AriaHeading
                slot="title"
                className="text-text-primary tracking-heading text-lg font-semibold"
              >
                {title}
              </AriaHeading>
              {description === undefined ? null : (
                <p className="text-text-tertiary mt-1 text-sm leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/*
           * Column-reverse on a phone — `CategoryDialog`'s own order — puts
           * the answer that deletes at the top of the stack and "Abbrechen"
           * nearest the thumb, so the reachable button is the harmless one.
           */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {/*
             * Cancel first in the DOM, so it is also the first stop for Tab:
             * the way out of a question about deleting something is reached
             * before the answer that deletes.
             */}
            <Button size="md" color="secondary" onClick={onCancel}>
              {de.confirm.cancel}
            </Button>
            <Button
              size="md"
              color={destructive ? 'primary-destructive' : 'primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </AriaDialog>
      </AriaModal>
    </AriaModalOverlay>
  );
}
