/**
 * The three writes both Application screens make — an edit, a discard, and the
 * internal-notes draft behind the drawer — wired once.
 *
 * Anfragen and Übersicht's "Offene Anfragen" panel render the same list and
 * the same drawer, so their containers would otherwise hold this block
 * verbatim, and the second copy is how the debounce and the draft's clearing
 * rule would drift apart.
 *
 * It is a hook rather than a component: what a screen takes is intent
 * callbacks (ADR-0006), and this is where an intent becomes a request.
 */

import { useCallback, useMemo } from 'react';

import type { ApplicationEdit } from '@/domain/application';
import { useEditApplication, useSetDiscarded } from '@/queries/applications';

import type { NotesField } from './useNotesDraft';
import { useNotesDraft } from './useNotesDraft';

export type ApplicationWrites = {
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  notes: NotesField;
};

export function useApplicationWrites(now: Date): ApplicationWrites {
  const { mutate: edit, mutateAsync: editAndWait } = useEditApplication();
  const { mutate: setDiscarded } = useSetDiscarded();

  const onEdit = useCallback(
    (id: string, change: ApplicationEdit) => {
      edit({ id, change });
    },
    [edit],
  );

  /**
   * The optimistic `discardedAt` is stamped from the reference date rather
   * than from the clock, so a test that injects one sees the date it injected.
   * The server stamps its own and the response carries it back (`API.md`).
   */
  const onDiscard = useCallback(
    (ids: ReadonlySet<string>) => {
      setDiscarded({ ids, discardedAt: now.toISOString() });
    },
    [setDiscarded, now],
  );

  /**
   * The note waits for its request, unlike the two above: the draft is cleared
   * on success and kept on failure, and that is a question only the settled
   * request answers.
   */
  const saveNotes = useCallback(
    (id: string, internalNotes: string) =>
      editAndWait({ id, change: { internalNotes } }),
    [editAndWait],
  );

  const notes = useNotesDraft(saveNotes);

  return useMemo(
    () => ({ onEdit, onDiscard, notes }),
    [onEdit, onDiscard, notes],
  );
}
