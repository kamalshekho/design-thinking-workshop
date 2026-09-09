/**
 * Anfragen's container: the cache above, intent callbacks below (ADR-0006).
 *
 * It holds no data of its own. `ApplicationsScreen` stays testable through
 * fixtures and props, and this is the file that has a `QueryClient` in it —
 * which is why the optimistic rollback and the notes draft are tested here
 * and not there.
 */

import { useApplications } from '@/queries/applications';
import { useCategories } from '@/queries/categories';
import { useOwners } from '@/queries/staffMembers';

import { ApplicationsScreen } from './ApplicationsScreen';
import type { ApplicationFilters } from './filterApplications';
import { useApplicationWrites } from './useApplicationWrites';

type ApplicationsContainerProps = {
  /** The reference date the relative ages and the "Lange offen" view are read against. */
  now: Date;
  /** The view/status a Übersicht metric card linked in with, if any. */
  initialFilters?: Partial<ApplicationFilters>;
};

export function ApplicationsContainer({
  now,
  initialFilters,
}: ApplicationsContainerProps) {
  const applications = useApplications();
  const categories = useCategories();
  const owners = useOwners();
  const writes = useApplicationWrites(now);

  return (
    <ApplicationsScreen
      now={now}
      initialFilters={initialFilters}
      applications={applications}
      categories={categories}
      owners={owners}
      onEdit={writes.onEdit}
      onDiscard={writes.onDiscard}
      notes={writes.notes}
    />
  );
}
