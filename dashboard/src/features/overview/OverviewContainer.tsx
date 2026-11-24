/**
 * Übersicht's container. The same writes Anfragen's container makes — the
 * panel below renders the same list and the same drawer — plus the State
 * changes the three cards' sparklines are replayed from.
 */

import { useApplications, useStateChanges } from '@/queries/applications';
import { useCategories } from '@/queries/categories';
import { useOwners } from '@/queries/staffMembers';
import { useApplicationWrites } from '@/queries/useApplicationWrites';

import { OverviewScreen } from './OverviewScreen';

type OverviewContainerProps = {
  staffName: string;
  /** The signed-in Staff member, whom "Übernehmen" on the phone page makes the Owner. */
  staffMemberId: string;
  now: Date;
};

export function OverviewContainer({
  staffName,
  staffMemberId,
  now,
}: OverviewContainerProps) {
  const applications = useApplications();
  const stateChanges = useStateChanges();
  const categories = useCategories();
  const owners = useOwners();
  const writes = useApplicationWrites(now);

  return (
    <OverviewScreen
      staffName={staffName}
      staffMemberId={staffMemberId}
      now={now}
      applications={applications}
      stateChanges={stateChanges}
      categories={categories}
      owners={owners}
      onEdit={writes.onEdit}
      onDiscard={writes.onDiscard}
      notes={writes.notes}
    />
  );
}
