/**
 * The controls Anfragen and Übersicht's "Offene Anfragen" panel both hang off
 * `useApplicationActions`: the bulk discard button on the toolbar, and what
 * opens over the list — the open Application's detail and the question before
 * a bulk discard. Both screens rendered them identically.
 */

import { Archive } from '@untitledui/icons';

import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import type { Owner } from '@/domain/application';
import type { Category } from '@/domain/category';
import type { ApplicationActions } from '@/hooks/useApplicationActions';
import type { NotesField } from '@/hooks/useNotesDraft';
import { notesValueFor } from '@/hooks/useNotesDraft';

import { ApplicationDetail } from './ApplicationDetail';
import { DiscardSelectedDialog } from './DiscardSelectedDialog';

/**
 * Always on the bar, disabled while nothing is checked, so the bulk action
 * stays discoverable instead of appearing out of nowhere and shifting the
 * toolbar the moment a row is ticked. It discards rather than deletes (`A16`),
 * hence the label and the archive icon, not a trash can.
 */
export function DiscardSelectedButton({
  actions,
}: {
  actions: ApplicationActions;
}) {
  return (
    <Button
      size="md"
      color="secondary"
      iconLeading={Archive}
      isDisabled={actions.selectedIds.size === 0}
      onClick={actions.discardSelected}
    >
      {de.applications.discardSelected(actions.selectedIds.size)}
    </Button>
  );
}

type ApplicationActionOverlaysProps = {
  actions: ApplicationActions;
  /** The signed-in Staff member, whom "Übernehmen" on the phone page makes the Owner. */
  staffMemberId: string;
  categories: readonly Category[];
  owners: readonly Owner[];
  notes: NotesField;
};

export function ApplicationActionOverlays({
  actions,
  staffMemberId,
  categories,
  owners,
  notes,
}: ApplicationActionOverlaysProps) {
  const { selected } = actions;

  return (
    <>
      {selected ? (
        <ApplicationDetail
          staffMemberId={staffMemberId}
          application={selected}
          categories={categories}
          owners={owners}
          onClose={actions.close}
          onChange={(change) => {
            actions.update(selected.id, change);
          }}
          notesValue={notesValueFor(notes, selected)}
          onNotesChange={(text) => {
            notes.onChange(selected.id, text);
          }}
        />
      ) : null}

      {actions.discardConfirmOpen ? (
        <DiscardSelectedDialog
          count={actions.selectedIds.size}
          onConfirm={actions.confirmDiscardSelected}
          onCancel={actions.cancelDiscardSelected}
        />
      ) : null}
    </>
  );
}
