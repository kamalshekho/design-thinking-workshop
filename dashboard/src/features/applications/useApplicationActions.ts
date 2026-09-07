/**
 * The moves Anfragen and Übersicht's "Offene Anfragen" panel both make on the
 * one Applications list: open a row in the drawer, tick rows, edit the open
 * Application, and discard one row or every ticked one (`A16`).
 *
 * Both screens held this state and these four functions verbatim — the second
 * copy is how the bulk confirmation and the "forget ids that just left"
 * bookkeeping could drift apart. The list itself stays where it was: this hook
 * owns no Applications, it edits through the callbacks the screen was handed.
 */

import { useState } from 'react';

import { de } from '@/content/de';
import type { Application } from '@/domain/application';

/** What the drawer may change about an Application; the rest is server-owned. */
export type ApplicationEdit = Partial<
  Pick<Application, 'status' | 'ownerId' | 'internalNotes'>
>;

type UseApplicationActionsOptions = {
  applications: readonly Application[];
  onApplicationsChange: (applications: Application[]) => void;
  /** Discards the named Applications; owned by `App`, since `discardedAt` is a field on the one list every screen reads. */
  onDiscard: (ids: ReadonlySet<string>) => void;
};

export function useApplicationActions({
  applications,
  onApplicationsChange,
  onDiscard,
}: UseApplicationActionsOptions) {
  /** The Application the drawer shows, or `null` while it is closed. */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** The checkbox selection the bulk buttons act on, tracked across pages. */
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const selected =
    applications.find((application) => application.id === selectedId) ?? null;

  function close(): void {
    setSelectedId(null);
  }

  /**
   * The row is the drawer's toggle: clicking the open row again closes it, so
   * the way out sits where the way in was. Clicking a different row swaps the
   * drawer's contents rather than closing it.
   */
  function toggle(id: string): void {
    setSelectedId((current) => (current === id ? null : id));
  }

  function update(id: string, change: ApplicationEdit): void {
    onApplicationsChange(
      applications.map((application) =>
        application.id === id ? { ...application, ...change } : application,
      ),
    );
  }

  /** Ids that just left the list cannot be acted on any more. */
  function forget(ids: ReadonlySet<string>): void {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.delete(id);
      }
      return next;
    });
  }

  function discard(ids: ReadonlySet<string>): void {
    onDiscard(ids);
    if (selectedId !== null && ids.has(selectedId)) {
      close();
    }
    forget(ids);
  }

  /**
   * Only the bulk action asks. A single row is one click from being back — the
   * fourth screen is the undo — while ticking rows and hitting the bar moves
   * several at once.
   */
  function discardSelected(): void {
    if (
      selectedIds.size > 0 &&
      window.confirm(de.applications.confirmDiscardSelected(selectedIds.size))
    ) {
      discard(selectedIds);
    }
  }

  return {
    selected,
    selectedId,
    selectedIds,
    setSelectedIds,
    open: setSelectedId,
    toggle,
    close,
    update,
    discard,
    discardSelected,
  };
}
