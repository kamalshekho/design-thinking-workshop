/**
 * One Application below 1024 px, as a page that covers the list rather than a
 * drawer beside it (issue #109). On a phone a Staff member reads a new
 * Application, becomes its Owner and changes its Status (`A29`), so the page
 * leads with those two: the Owner with one "Übernehmen" button, and the six
 * Statuses as buttons of at least 44 px instead of a select. The message, the
 * notes and the consent record follow in the drawer's own markup
 * (`ApplicationDetailSections`).
 *
 * Handing the Application to somebody else stays at the desk, so the page
 * offers only the signed-in Staff member as the new Owner. "Zurück" and Escape
 * both close it, the same `onClose` the drawer calls.
 */

import { ArrowLeft, Mail01, UserCheck01 } from '@untitledui/icons';
import { useEffect, useRef } from 'react';

import { STATUS_DOT_CLASSNAME } from '@/components/application/application-status/statusStyles';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';
import { Dot } from '@/components/foundations/dot-icon';
import { de } from '@/content/de';
import { APPLICATION_STATUSES } from '@/domain/application';
import { useCloseOnEscape } from '@/hooks/useCloseOnEscape';
import { cx } from '@/utils/cx';
import { initialsOf } from '@/utils/initials';

import {
  ConsentSection,
  MessageSection,
  NotesSection,
  SectionLabel,
} from './ApplicationDetailSections';
import type { ApplicationDrawerProps } from './ApplicationDrawer';

type ApplicationPageProps = ApplicationDrawerProps & {
  staffMemberId: string;
};

export function ApplicationPage({
  application,
  categories,
  owners,
  onClose,
  onChange,
  notesValue,
  onNotesChange,
  staffMemberId,
}: ApplicationPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const category = categories.find(
    (entry) => entry.id === application.categoryId,
  );
  const ownerName =
    application.ownerId === null
      ? null
      : (owners.find((owner) => owner.id === application.ownerId)?.name ??
        application.ownerId);
  const ownedByMe = application.ownerId === staffMemberId;

  useCloseOnEscape(onClose);

  /** Another Application opens at its top, with the reading position on it. */
  useEffect(() => {
    const page = pageRef.current;
    if (page !== null) {
      page.scrollTop = 0;
      page.focus({ preventScroll: true });
    }
  }, [application.id]);

  return (
    <div
      ref={pageRef}
      tabIndex={-1}
      role="region"
      aria-label={de.detail.title}
      className="bg-bg-canvas fixed inset-0 z-30 overflow-y-auto outline-hidden"
    >
      <header className="border-secondary bg-primary sticky top-0 z-10 flex h-14 items-center border-b px-2">
        <button
          type="button"
          aria-label={de.detail.backLabel}
          onClick={onClose}
          className="text-secondary outline-focus-ring hover:bg-primary_hover flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          {de.detail.back}
        </button>
      </header>

      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-5 pb-28">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex">
            <Avatar size="lg" initials={initialsOf(application.name)} />
          </span>
          <div className="min-w-0">
            <h2 className="text-primary tracking-heading text-xl leading-7 font-semibold break-words">
              {application.name}
            </h2>
            <p className="text-tertiary text-sm">
              {category?.name ?? application.categoryId} ·{' '}
              {de.weeklyTimes[application.weeklyTime]}
            </p>
          </div>
        </div>

        <section className="border-secondary bg-primary flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <Avatar
            size="sm"
            alt=""
            initials={ownerName === null ? undefined : initialsOf(ownerName)}
          />
          <p className="text-secondary min-w-0 flex-1 text-sm">
            {ownerName === null ? (
              <span className="text-quaternary">
                {de.application.unassigned}
              </span>
            ) : ownedByMe ? (
              de.detail.ownedByYou
            ) : (
              de.detail.ownedBy(ownerName)
            )}
          </p>
          {ownedByMe ? null : (
            <Button
              size="md"
              color="primary"
              iconLeading={UserCheck01}
              onPress={() => {
                onChange({ ownerId: staffMemberId });
              }}
            >
              {de.detail.takeOver}
            </Button>
          )}
        </section>

        <section>
          <SectionLabel>{de.detail.status}</SectionLabel>
          <div
            role="radiogroup"
            aria-label={de.detail.status}
            className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3"
          >
            {APPLICATION_STATUSES.map((status) => {
              const checked = application.status === status;

              return (
                <button
                  key={status}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    onChange({ status });
                  }}
                  className={cx(
                    'outline-focus-ring flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm leading-tight font-medium focus-visible:outline-2',
                    checked
                      ? 'border-fuut-purple bg-primary text-primary ring-fuut-purple ring-1'
                      : 'border-secondary bg-primary text-secondary',
                  )}
                >
                  <Dot
                    size="sm"
                    aria-hidden="true"
                    className={cx('shrink-0', STATUS_DOT_CLASSNAME[status])}
                  />
                  {de.statuses[status]}
                </button>
              );
            })}
          </div>
        </section>

        <MessageSection application={application} />
        <NotesSection
          id={`application-notes-${application.id}`}
          value={notesValue}
          onChange={onNotesChange}
        />
        <ConsentSection application={application} />
      </article>

      <footer className="border-secondary bg-primary pb-safe-bottom fixed inset-x-0 bottom-0 flex border-t px-4 pt-3">
        <Button
          size="lg"
          color="secondary"
          href={`mailto:${application.email}`}
          iconLeading={Mail01}
          className="mx-auto w-full max-w-2xl"
        >
          {de.detail.writeMail}
        </Button>
      </footer>
    </div>
  );
}
