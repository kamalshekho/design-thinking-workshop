/**
 * The question the bulk "Aussortieren" asks, on Anfragen and on Übersicht's
 * panel alike.
 *
 * A component of its own because both screens drive the same action through
 * `useApplicationActions`, and the wording of the question belongs with the
 * action rather than twice in two screens — the second copy is how the two
 * would come to say different things about the same click.
 *
 * Not destructive: discarding is the one confirmation here that takes nothing
 * away. The Application keeps its Status, Owner, Category and notes and waits
 * on Aussortiert (`A16`), so the dialog says where the rows go, and the
 * confirming button carries the plain brand colour rather than the danger one.
 */

import { Archive } from '@untitledui/icons';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { de } from '@/content/de';

type DiscardSelectedDialogProps = {
  /** How many rows are ticked; the question counts them. */
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DiscardSelectedDialog({
  count,
  onConfirm,
  onCancel,
}: DiscardSelectedDialogProps) {
  return (
    <ConfirmDialog
      icon={Archive}
      destructive={false}
      title={de.applications.confirmDiscardSelected(count)}
      description={de.applications.confirmDiscardSelectedHint(count)}
      confirmLabel={de.applications.discard}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
