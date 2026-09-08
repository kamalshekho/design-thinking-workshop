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

import {
  Check,
  ChevronDown,
  Copy01,
  Mail01,
  ShieldTick,
} from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { STATUS_DOT_CLASSNAME } from '@/components/application/application-status/status-styles';
import { Button } from '@/components/base/buttons/button';
import { CloseButton } from '@/components/base/buttons/close-button';
import { Tooltip } from '@/components/base/tooltip/tooltip';
import { Dot } from '@/components/foundations/dot-icon';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationStatus,
  Category,
  Owner,
} from '@/domain/application';
import { APPLICATION_STATUSES } from '@/domain/application';
import { cx } from '@/utils/cx';

import { CONTROL_CLASSNAME } from './controlStyles';
import { OwnerSelect } from './OwnerSelect';
import type { ApplicationEdit } from './useApplicationActions';

type ApplicationDrawerProps = {
  application: Application;
  categories: readonly Category[];
  owners: readonly Owner[];
  onClose: () => void;
  /**
   * One callback for the three fields the drawer edits, rather than one each:
   * both screens funnelled all three into the same "replace this Application"
   * update, and spelling that out three times per screen is what kept the
   * wiring longer than the drawer.
   */
  onChange: (change: ApplicationEdit) => void;
};

/** How long "Kopiert" stays on the copy button before it reverts. */
const COPY_FEEDBACK_MS = 1800;

const SELECT_CLASSNAME = cx(
  CONTROL_CLASSNAME,
  'h-control cursor-pointer appearance-none py-0 pr-9 pl-9 font-medium',
);

/**
 * The eyebrow the page header already uses, reused so a section label inside
 * the drawer reads as the same rank of heading as everywhere else.
 */
function SectionLabel({
  children,
  icon: Icon,
  htmlFor,
}: {
  children: ReactNode;
  icon?: typeof ShieldTick;
  /** Given when the section *is* a field, so the label names the control. */
  htmlFor?: string;
}) {
  const className =
    'text-text-tertiary flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase';
  const content = (
    <>
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </>
  );

  return htmlFor === undefined ? (
    <h3 className={className}>{content}</h3>
  ) : (
    <label htmlFor={htmlFor} className={className}>
      {content}
    </label>
  );
}

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
}: ApplicationDrawerProps) {
  /**
   * The address that was copied, not a flag: opening another Application then
   * shows the plain label again without an effect that resets it.
   */
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const copied = copiedEmail === application.email;
  const panelRef = useRef<HTMLElement>(null);

  const category = categories.find(
    (entry) => entry.id === application.categoryId,
  );
  const notesId = `application-notes-${application.id}`;
  const notesHintId = `${notesId}-hint`;

  /**
   * A drawer that opens over the list closes on Escape wherever focus sits —
   * unless something inside it has already answered that Escape. `OwnerSelect`
   * closes its own popover with it, and one key press should dismiss one layer.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  /** Moves the reading position into the panel when another row is opened. */
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [application.id]);

  /** The copy confirmation reverts on its own, and never outlives the panel. */
  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopiedEmail(null);
    }, COPY_FEEDBACK_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copied]);

  function copyEmail(): void {
    void navigator.clipboard.writeText(application.email);
    setCopiedEmail(application.email);
  }

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-label={de.detail.title}
      className="drawer-entering border-secondary bg-primary fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l shadow-lg outline-hidden sm:w-[460px] lg:w-[480px]"
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
              className="text-tertiary hover:text-secondary outline-focus-ring mt-0.5 flex max-w-full cursor-pointer items-center gap-1.5 rounded text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
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
              <span className="text-secondary mb-1.5 block text-[13px] font-medium">
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
                    onChange({
                      status: event.target.value as ApplicationStatus,
                    });
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
          </div>
        </section>

        <section className="mt-7">
          <SectionLabel>{de.detail.about}</SectionLabel>
          {/* Content, not a field: a reading surface, and the drawer — not an
              inner box — is what scrolls when the message runs long. */}
          <div className="border-secondary bg-secondary text-primary mt-2.5 rounded-[10px] border px-4 py-3.5 text-sm leading-relaxed break-words whitespace-pre-line">
            {application.about}
          </div>
        </section>

        <section className="mt-7">
          <SectionLabel htmlFor={notesId}>
            {de.detail.internalNotes}
          </SectionLabel>
          <p id={notesHintId} className="text-tertiary mt-1 text-xs">
            {de.detail.notesHint}
          </p>
          <textarea
            id={notesId}
            aria-describedby={notesHintId}
            value={application.internalNotes}
            placeholder={de.detail.notesPlaceholder}
            onChange={(event) => {
              onChange({ internalNotes: event.target.value });
            }}
            className={cx(
              CONTROL_CLASSNAME,
              // `text-quaternary`, not the reference Input's `text-placeholder`:
              // the theme defines the former and never defined the latter.
              'placeholder:text-quaternary mt-2.5 min-h-28 resize-y px-3 py-2.5 leading-relaxed',
            )}
          />
        </section>

        <section className="border-secondary mt-7 border-t pt-5">
          <SectionLabel icon={ShieldTick}>{de.detail.consent}</SectionLabel>
          <dl className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-tertiary">{de.detail.consentAt}</dt>
              <dd className="text-secondary tabular-nums">
                {new Date(application.consentAt).toLocaleDateString('de-DE')}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-tertiary">{de.detail.consentTextVersion}</dt>
              <dd className="text-secondary tabular-nums">
                {de.detail.consentTextVersionValue(
                  application.consentTextVersion,
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="border-secondary bg-primary flex shrink-0 items-center gap-2 border-t px-6 py-4">
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
      </div>
    </aside>
  );
}
