/**
 * The full Application. Everything the list does not show lives here: the
 * about text, internal notes, consent metadata, the owner, and the Status
 * change.
 *
 * There is no email composer — issue #10 rules one out. The drawer offers a
 * mail link and a copy action; automated replies stay backend-owned. The link
 * is a plain `mailto:` with no subject, so it opens whichever client the Staff
 * member's machine has configured and invents no wording of its own.
 *
 * Shape: a fixed-height flex column, so the identity block and the action bar
 * are pinned by the layout itself and only the content between them scrolls —
 * "E-Mail schreiben" is reachable from any scroll position. Order of the body
 * follows how an Application is worked: decide (Workflow), read (Nachricht),
 * record (Interne Notizen), verify (Einwilligung).
 *
 * Status stays a native `select`, restyled with `appearance-none` down to a
 * chevron we draw ourselves. A native select is keyboard- and
 * screen-reader-correct on every platform for free, opens the platform's own
 * picker on touch, and — unlike a popover listbox — cannot escape the drawer's
 * scroll container. What made the old panel look unfinished was the default
 * chrome, not the element. Its options are words plus one coloured dot, and the
 * dot sits on the control, not in the list, so nothing is lost.
 *
 * Zuständigkeit cannot keep that element: its options are people, identified by
 * a photo or their initials, and an `option` holds text only. It is
 * `OwnerSelect`, a React Aria listbox, and that file carries the trade-off.
 *
 * There is deliberately no previous/next pair in the header: the table sorts
 * its own rows, so a "next" here would step through a different order than the
 * one on screen.
 */

import { Check, ChevronDown, Copy01, Mail01 } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { STATUS_DOT_CLASSNAME } from '@/components/application/application-status/statusStyles';
import { Button } from '@/components/base/buttons/button';
import { CloseButton } from '@/components/base/buttons/close-button';
import { Tooltip } from '@/components/base/tooltip/tooltip';
import { Dot } from '@/components/foundations/dot-icon';
import { de } from '@/content/de';
import type { Application, ApplicationEdit, Owner } from '@/domain/application';
import {
  APPLICATION_STATUSES,
  isApplicationStatus,
} from '@/domain/application';
import type { Category } from '@/domain/category';
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { cx } from '@/utils/cx';

import {
  ConsentSection,
  MessageSection,
  NotesSection,
  OnboardingSection,
  SectionLabel,
} from './ApplicationDetailSections';
import { CONTROL_CLASSNAME } from './controlStyles';
import { OwnerSelect } from './OwnerSelect';

export type ApplicationDrawerProps = {
  application: Application;
  categories: readonly Category[];
  owners: readonly Owner[];
  onClose: () => void;
  /**
   * Status and Zuständigkeit: one callback for both, because both are one
   * click and travel as the same `PATCH`.
   */
  onChange: (change: ApplicationEdit) => void;
  /**
   * What the notes field shows. Not `application.internalNotes`: while a note
   * is unsent the container's draft is the truth, and the cache holds the echo
   * of the last note that landed (`useNotesDraft`).
   */
  notesValue: string;
  onNotesChange: (text: string) => void;
};

const SELECT_CLASSNAME = cx(
  CONTROL_CLASSNAME,
  'h-control cursor-pointer appearance-none py-0 pr-9 pl-9 font-medium',
);

/** Status, Kategorie and Verfügbarkeit as one neutral strip; only the dot carries colour. */
function MetaChip({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cx(
        'border-secondary bg-primary text-secondary inline-flex h-6.5 max-w-full min-w-0 items-center gap-1.5 rounded-md border px-2 text-xs font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ApplicationDrawer({
  application,
  categories,
  owners,
  onClose,
  onChange,
  notesValue,
  onNotesChange,
}: ApplicationDrawerProps) {
  const { copied, copy: copyEmail } = useCopyFeedback(application.email);

  const { copied: copiedOnboarding, copy: copyOnboardingLink } =
    useCopyFeedback(application.onboarding?.link ?? null);

  const panelRef = useRef<HTMLElement>(null);

  const category = categories.find(
    (entry) => entry.id === application.categoryId,
  );

  const notesId = `application-notes-${application.id}`;

  useCloseOnEscape(onClose);

  /** Moves the reading position into the panel when another row is opened. */
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [application.id]);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-label={de.detail.title}
      className="drawer-entering border-secondary bg-primary sm:w-drawer lg:w-drawer-lg fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l shadow-lg outline-hidden"
    >
      <header className="border-secondary shrink-0 border-b px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-primary tracking-heading truncate text-lg leading-6 font-semibold">
              {application.name}
            </h2>
            <button
              type="button"
              title={de.detail.copyMail}
              onClick={copyEmail}
              className="text-tertiary hover:text-secondary outline-focus-ring tap-target text-body-sm relative mt-0.5 flex max-w-full cursor-pointer items-center gap-1.5 rounded transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <span className="truncate">{application.email}</span>
              {/* Same state the footer button reads, so a click here confirms
                  itself where the eye already is. */}
              {copied ? (
                <Check
                  aria-hidden="true"
                  className="text-utility-green-500 size-3.5 shrink-0"
                />
              ) : null}
            </button>
          </div>

          <Tooltip title={de.detail.close} placement="bottom">
            <CloseButton
              size="sm"
              slot={null}
              label={de.detail.close}
              onPress={onClose}
              className="-mt-1 -mr-2 shrink-0"
            />
          </Tooltip>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <MetaChip>
            <Dot
              size="sm"
              aria-hidden="true"
              className={cx(
                'shrink-0',
                STATUS_DOT_CLASSNAME[application.status],
              )}
            />
            {de.statuses[application.status]}
          </MetaChip>
          <MetaChip title={category?.name ?? application.categoryId}>
            <span className="truncate">
              {category?.name ?? application.categoryId}
            </span>
          </MetaChip>
          <MetaChip>{de.weeklyTimes[application.weeklyTime]}</MetaChip>
        </div>
      </header>

      <div className="min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain px-6 pt-5 pb-6">
        <section>
          <SectionLabel>{de.detail.workflow}</SectionLabel>

          <div className="mt-3 flex flex-col gap-3.5">
            <label className="block">
              <span className="text-secondary text-body-sm mb-1.5 block font-medium">
                {de.detail.status}
              </span>
              <span className="relative block">
                {/* Boxed to the icon's 16px so both controls' leading glyph
                    and their text start on the same two verticals. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-3 flex size-4 -translate-y-1/2 items-center justify-center"
                >
                  <Dot
                    size="sm"
                    className={STATUS_DOT_CLASSNAME[application.status]}
                  />
                </span>
                <select
                  value={application.status}
                  onChange={(event) => {
                    if (isApplicationStatus(event.target.value)) {
                      onChange({ status: event.target.value });
                    }
                  }}
                  className={SELECT_CLASSNAME}
                >
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {de.statuses[status]}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="text-fg-quaternary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
                />
              </span>
            </label>

            <OwnerSelect
              ownerId={application.ownerId}
              owners={owners}
              onChange={(ownerId) => {
                onChange({ ownerId });
              }}
            />

            <OnboardingSection application={application} />
          </div>
        </section>

        <MessageSection application={application} className="mt-7" />
        <NotesSection
          id={notesId}
          value={notesValue}
          onChange={onNotesChange}
          className="mt-7"
        />
        <ConsentSection application={application} className="mt-7" />
      </div>

      <div className="border-secondary bg-primary flex shrink-0 flex-wrap items-center gap-2 border-t px-6 py-4">
        <Button
          size="md"
          color="primary"
          href={`mailto:${application.email}`}
          iconLeading={Mail01}
          className="flex-1"
        >
          {de.detail.writeMail}
        </Button>
        <Button
          size="md"
          color="secondary"
          aria-label={de.detail.copyMail}
          iconLeading={copied ? Check : Copy01}
          onPress={copyEmail}
        >
          {copied ? de.detail.copied : de.detail.copyMailShort}
        </Button>
        {application.onboarding !== null ? (
          <Button
            size="md"
            color="secondary"
            aria-label={de.detail.copyOnboardingLink}
            iconLeading={copiedOnboarding ? Check : Copy01}
            onPress={copyOnboardingLink}
            className="w-full"
          >
            {copiedOnboarding ? de.detail.copied : de.detail.copyOnboardingLink}
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
