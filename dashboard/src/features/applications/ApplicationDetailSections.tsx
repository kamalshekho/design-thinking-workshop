/**
 * The parts of an Application that the drawer and the phone page
 * (`ApplicationPage`) both show, in the same markup: the section label, the
 * Applicant's message, the internal notes and the consent record. The two
 * differ in where the Status and the Owner sit, not in these.
 */

import { ShieldTick } from '@untitledui/icons';
import type { ReactNode } from 'react';

import { de } from '@/content/de';
import type { Application } from '@/domain/application';
import { INTERNAL_NOTES_MAX_LENGTH } from '@/domain/application';
import { cx } from '@/utils/cx';

import { CONTROL_CLASSNAME } from './controlStyles';

/**
 * The eyebrow the page header already uses, reused so a section label inside
 * the drawer reads as the same rank of heading as everywhere else.
 */
export function SectionLabel({
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

/** What the Applicant wrote about themselves. */
export function MessageSection({
  application,
  className,
}: {
  application: Application;
  className?: string;
}) {
  return (
    <section className={className}>
      <SectionLabel>{de.detail.about}</SectionLabel>
      {/* Content, not a field: a reading surface, and the drawer — not an
          inner box — is what scrolls when the message runs long. */}
      <div className="border-secondary bg-secondary text-primary mt-2.5 rounded-[10px] border px-4 py-3.5 text-sm leading-relaxed break-words whitespace-pre-line">
        {application.about}
      </div>
    </section>
  );
}

/**
 * The internal notes. `value` is the container's draft, not
 * `application.internalNotes` (`useNotesDraft`).
 */
export function NotesSection({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (text: string) => void;
  className?: string;
}) {
  const hintId = `${id}-hint`;

  return (
    <section className={className}>
      <SectionLabel htmlFor={id}>{de.detail.internalNotes}</SectionLabel>
      <textarea
        id={id}
        aria-describedby={hintId}
        value={value}
        maxLength={INTERNAL_NOTES_MAX_LENGTH}
        placeholder={de.detail.notesPlaceholder}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={cx(
          CONTROL_CLASSNAME,
          // `text-quaternary`, not the reference Input's `text-placeholder`:
          // the theme defines the former and never defined the latter.
          'placeholder:text-quaternary mt-2.5 min-h-28 resize-y px-3 py-2.5 leading-relaxed',
        )}
      />
      {/* The hint and the countdown are one description, so the field
          names its limit to a screen reader as well as on screen. */}
      <div
        id={hintId}
        className="text-tertiary mt-1 flex justify-between gap-3 text-xs"
      >
        <span>{de.detail.notesHint}</span>
        <span className="tabular-nums">
          {de.fields.remaining(INTERNAL_NOTES_MAX_LENGTH - value.length)}
        </span>
      </div>
    </section>
  );
}

/** When the Applicant consented, and to which wording. */
export function ConsentSection({
  application,
  className,
}: {
  application: Application;
  className?: string;
}) {
  return (
    <section className={cx('border-secondary border-t pt-5', className)}>
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
            {de.detail.consentTextVersionValue(application.consentTextVersion)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
