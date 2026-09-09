/**
 * The internal-notes draft: the one piece of screen state that lives in the
 * container rather than in the component that renders it (ADR-0006).
 *
 * Three rules make it worth its own module:
 *
 * - **the field does not read the cache while a draft exists.** Every write
 *   the dashboard makes is echoed by the live stream, including the Staff
 *   member's own — so without a draft, the echo of the note sent 800 ms ago
 *   would replace whatever has been typed since;
 * - **the draft outlives the request until it succeeds.** A failed save leaves
 *   the typed text on screen, where the Staff member can still see it and
 *   copy it out, rather than reverting to the last note the server has;
 * - **closing the drawer does not cancel the send.** The timer lives here, in
 *   the container, which stays mounted while the drawer comes and goes — so
 *   closing it flushes rather than discards.
 *
 * One draft at a time, because one drawer is open at a time. Typing into
 * another Application's notes sends the pending one first rather than dropping
 * it: two drafts would need two timers to answer a case a Staff member reaches
 * by clicking one row after another.
 */

import { useCallback, useEffect, useState } from 'react';

import type { Application } from '@/domain/application';
import { NOTES_DEBOUNCE_MS } from '@/domain/application';

export type NotesDraft = {
  applicationId: string;
  text: string;
};

/**
 * What the container hands down, as one prop: both screens render
 * `ApplicationDrawer` and neither has a use for the draft other than passing
 * it through, so two props would be threaded twice for one idea.
 */
export type NotesField = {
  /** The unsent note, or `null` while the field shows what the cache holds. */
  draft: NotesDraft | null;
  onChange: (applicationId: string, text: string) => void;
};

/**
 * What the notes field shows for one Application: the draft while there is one
 * for it, and what the cache holds otherwise — including for every other
 * Application while a draft exists for this one.
 */
export function notesValueFor(
  notes: NotesField,
  application: Pick<Application, 'id' | 'internalNotes'>,
): string {
  return notes.draft?.applicationId === application.id
    ? notes.draft.text
    : application.internalNotes;
}

/**
 * `save` is the container's `PATCH`, and it has to be awaitable: the draft is
 * cleared on success and only on success, and "did it land?" is the one
 * question this hook cannot answer for itself.
 */
export function useNotesDraft(
  save: (applicationId: string, text: string) => Promise<unknown>,
): NotesField {
  const [draft, setDraft] = useState<NotesDraft | null>(null);

  const send = useCallback(
    (pending: NotesDraft) => {
      void save(pending.applicationId, pending.text).then(
        () => {
          /**
           * Cleared only if nothing has been typed since the request left —
           * otherwise the newer text is the draft and this one has already
           * been superseded.
           */
          setDraft((current) =>
            current !== null &&
            current.applicationId === pending.applicationId &&
            current.text === pending.text
              ? null
              : current,
          );
        },
        () => {
          /** The failure is reported by the mutation; the text stays put. */
        },
      );
    },
    [save],
  );

  /**
   * The debounce. Re-arming on every keystroke is what makes it one: the
   * effect's cleanup cancels the previous timer, and a draft that has not
   * changed — because the save failed — is not re-sent on its own.
   */
  useEffect(() => {
    if (draft === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      send(draft);
    }, NOTES_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, send]);

  /**
   * A draft for another Application is sent now rather than replaced: the
   * Staff member left it behind by clicking the next row, not by deciding
   * against it. The check reads `draft` from the render that handled the
   * keystroke, which is the current one — every keystroke re-renders.
   */
  const onChange = useCallback(
    (applicationId: string, text: string) => {
      if (draft !== null && draft.applicationId !== applicationId) {
        send(draft);
      }

      setDraft({ applicationId, text });
    },
    [draft, send],
  );

  return { draft, onChange };
}
