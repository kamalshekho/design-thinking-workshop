/**
 * PROTOTYPE (issue #109), throwaway. Two phone shapes for one Application,
 * built around the three things `A29` says happen on a phone: read it, become
 * its Owner, change its Status.
 *
 * - `ApplicationSheet` (variant B, below 640 px): a bottom sheet over the
 *   list. The actions sit in a bar at the bottom, under the thumb.
 * - `ApplicationPage` (variant C, below 1024 px): a page of its own that
 *   replaces the list, with a back button. The actions come first, the
 *   message after them.
 *
 * Mail, notes and consent stay as in `ApplicationDrawer`, only moved.
 */

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Mail01,
  UserCheck01,
} from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { STATUS_DOT_CLASSNAME } from '@/components/application/application-status/status-styles';
import { Avatar } from '@/components/base/avatar/avatar';
import { Button } from '@/components/base/buttons/button';
import { CloseButton } from '@/components/base/buttons/close-button';
import { Dot } from '@/components/foundations/dot-icon';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  ApplicationStatus,
  Category,
  Owner,
} from '@/domain/application';
import {
  APPLICATION_STATUSES,
  INTERNAL_NOTES_MAX_LENGTH,
} from '@/domain/application';
import { CONTROL_CLASSNAME } from '@/features/applications/controlStyles';
import { OwnerSelect } from '@/features/applications/OwnerSelect';
import { useCurrentSignIn } from '@/queries/session';
import { cx } from '@/utils/cx';
import { initialsOf } from '@/utils/initials';

export type DetailVariantProps = {
  application: Application;
  categories: readonly Category[];
  owners: readonly Owner[];
  onClose: () => void;
  onChange: (change: ApplicationEdit) => void;
  notesValue: string;
  onNotesChange: (text: string) => void;
};

function useMyId(): string | null {
  const { data } = useCurrentSignIn();
  return data !== undefined && data.kind !== 'none'
    ? data.staffMember.id
    : null;
}

function useEscape(onClose: () => void): void {
  useEffect(() => {
    function onKey(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
}

function Label({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-text-tertiary text-[11px] font-semibold tracking-[0.06em] uppercase">
      {children}
    </h3>
  );
}

function Message({ application }: { application: Application }) {
  return (
    <section>
      <Label>{de.detail.about}</Label>
      <div className="border-secondary bg-secondary text-primary mt-2.5 rounded-[10px] border px-4 py-3.5 text-[15px] leading-relaxed break-words whitespace-pre-line">
        {application.about ?? '–'}
      </div>
    </section>
  );
}

function Notes({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  return (
    <section>
      <Label>{de.detail.internalNotes}</Label>
      <textarea
        aria-label={de.detail.internalNotes}
        value={value}
        maxLength={INTERNAL_NOTES_MAX_LENGTH}
        placeholder={de.detail.notesPlaceholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cx(
          CONTROL_CLASSNAME,
          'placeholder:text-quaternary mt-2.5 min-h-24 resize-y px-3 py-2.5 text-base leading-relaxed',
        )}
      />
      <p className="text-tertiary mt-1 text-xs">{de.detail.notesHint}</p>
    </section>
  );
}

function Consent({ application }: { application: Application }) {
  return (
    <p className="text-tertiary text-xs">
      {de.detail.consent}: {de.detail.consentAt}{' '}
      {new Date(application.consentAt).toLocaleDateString('de-DE')},{' '}
      {de.detail.consentTextVersion}{' '}
      {de.detail.consentTextVersionValue(application.consentTextVersion)}
    </p>
  );
}

function StatusSelect({
  status,
  onChange,
}: {
  status: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
}) {
  return (
    <span className="relative block min-w-0 flex-1">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 flex size-4 -translate-y-1/2 items-center justify-center"
      >
        <Dot size="sm" className={STATUS_DOT_CLASSNAME[status]} />
      </span>
      <select
        aria-label={de.detail.status}
        value={status}
        onChange={(event) => {
          onChange(event.target.value as ApplicationStatus);
        }}
        className={cx(
          CONTROL_CLASSNAME,
          'h-11 cursor-pointer appearance-none py-0 pr-9 pl-9 text-base font-medium',
        )}
      >
        {APPLICATION_STATUSES.map((value) => (
          <option key={value} value={value}>
            {de.statuses[value]}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-fg-quaternary pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </span>
  );
}

/** Variant B, below 640 px. */
export function ApplicationSheet({
  application,
  categories,
  owners,
  onClose,
  onChange,
  notesValue,
  onNotesChange,
}: DetailVariantProps) {
  useEscape(onClose);
  const me = useMyId();
  const mine = me !== null && application.ownerId === me;
  const category = categories.find((c) => c.id === application.categoryId);
  const ownerName = owners.find((o) => o.id === application.ownerId)?.name;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label={de.detail.close}
        onClick={onClose}
        className="bg-overlay/40 absolute inset-0 cursor-default backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={application.name}
        className="bg-primary absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl shadow-xl"
      >
        <span
          aria-hidden="true"
          className="bg-quaternary mx-auto mt-2 h-1 w-10 shrink-0 rounded-full"
        />
        <header className="border-secondary flex shrink-0 items-start gap-3 border-b px-5 pt-3 pb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-primary truncate text-lg font-semibold">
              {application.name}
            </h2>
            <p className="text-tertiary truncate text-sm">
              {category?.name} · {de.weeklyTimes[application.weeklyTime]}
            </p>
          </div>
          <CloseButton
            size="md"
            slot={null}
            label={de.detail.close}
            onPress={onClose}
          />
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-5 py-5">
          <Message application={application} />
          <section>
            <OwnerSelect
              ownerId={application.ownerId}
              owners={owners}
              onChange={(ownerId) => {
                onChange({ ownerId });
              }}
            />
          </section>
          <Notes value={notesValue} onChange={onNotesChange} />
          <Consent application={application} />
        </div>

        <footer className="border-secondary bg-primary flex shrink-0 flex-col gap-2.5 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {mine ? (
            <p className="text-secondary flex items-center gap-1.5 text-sm">
              <Check
                className="text-utility-green-500 size-4"
                aria-hidden="true"
              />
              Du bist zuständig
            </p>
          ) : (
            <Button
              size="lg"
              color="primary"
              iconLeading={UserCheck01}
              onPress={() => {
                if (me !== null) {
                  onChange({ ownerId: me });
                }
              }}
            >
              {ownerName === undefined
                ? 'Übernehmen'
                : `Von ${ownerName.split(' ')[0] ?? ownerName} übernehmen`}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <StatusSelect
              status={application.status}
              onChange={(status) => {
                onChange({ status });
              }}
            />
            <Button
              size="lg"
              color="secondary"
              aria-label={de.detail.writeMail}
              iconLeading={Mail01}
              href={`mailto:${application.email}`}
            />
          </div>
        </footer>
      </section>
    </div>
  );
}

/** Variant C, below 1024 px. */
export function ApplicationPage({
  application,
  categories,
  owners,
  onClose,
  onChange,
  notesValue,
  onNotesChange,
}: DetailVariantProps) {
  useEscape(onClose);
  const me = useMyId();
  const mine = me !== null && application.ownerId === me;
  const category = categories.find((c) => c.id === application.categoryId);
  const ownerName = owners.find((o) => o.id === application.ownerId)?.name;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [application.id]);

  return (
    <div className="bg-bg-canvas fixed inset-0 z-40 overflow-y-auto">
      <header className="border-secondary bg-primary sticky top-0 z-10 flex h-14 items-center gap-2 border-b px-2">
        <button
          type="button"
          onClick={onClose}
          className="text-secondary outline-focus-ring hover:bg-primary_hover flex h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-sm font-semibold focus-visible:outline-2"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          {de.navigation.applications}
        </button>
      </header>

      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pt-5 pb-28">
        <div className="flex items-center gap-3">
          <Avatar size="lg" initials={initialsOf(application.name)} />
          <div className="min-w-0">
            <h1 className="text-primary text-xl leading-7 font-semibold break-words">
              {application.name}
            </h1>
            <p className="text-tertiary text-sm">
              {category?.name} · {de.weeklyTimes[application.weeklyTime]}
            </p>
          </div>
        </div>

        <section className="border-secondary bg-primary flex flex-wrap items-center gap-3 rounded-xl border p-3">
          <Avatar
            size="sm"
            alt=""
            initials={
              ownerName === undefined ? undefined : initialsOf(ownerName)
            }
          />
          <p className="text-secondary min-w-0 flex-1 text-sm">
            {ownerName === undefined ? (
              <span className="text-quaternary">
                {de.application.unassigned}
              </span>
            ) : mine ? (
              'Du bist zuständig'
            ) : (
              `Zuständig: ${ownerName}`
            )}
          </p>
          {mine ? null : (
            <Button
              size="md"
              color="primary"
              iconLeading={UserCheck01}
              onPress={() => {
                if (me !== null) {
                  onChange({ ownerId: me });
                }
              }}
            >
              Übernehmen
            </Button>
          )}
        </section>

        <section>
          <Label>{de.detail.status}</Label>
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
                  <span>{de.statuses[status]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <Message application={application} />
        <Notes value={notesValue} onChange={onNotesChange} />
        <Consent application={application} />
      </article>

      <footer className="border-secondary bg-primary fixed inset-x-0 bottom-0 flex gap-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          color="secondary"
          href={`mailto:${application.email}`}
          iconLeading={Mail01}
          className="flex-1"
        >
          {de.detail.writeMail}
        </Button>
      </footer>
    </div>
  );
}
