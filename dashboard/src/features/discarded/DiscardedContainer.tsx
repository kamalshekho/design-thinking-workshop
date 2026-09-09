/**
 * Aussortiert's container.
 *
 * Two things happen here rather than on the screen: the discarded
 * Applications are selected out of the one list every screen reads — the
 * fourth screen shows every row it is handed — and the two writes are wired.
 * Restoring is optimistic like a discard; erasing awaits the server, because
 * there is no undo behind it (`API.md`).
 */

import { useMemo } from 'react';

import { isDiscarded } from '@/domain/application';
import {
  useApplications,
  useEraseApplications,
  useSetDiscarded,
} from '@/queries/applications';
import { useCategories } from '@/queries/categories';
import { useOwners } from '@/queries/staffMembers';

import { DiscardedApplicationsScreen } from './DiscardedApplicationsScreen';

export function DiscardedContainer({ now }: { now: Date }) {
  const applications = useApplications();
  const { mutate: setDiscarded } = useSetDiscarded();
  const { mutate: erase } = useEraseApplications();
  const categories = useCategories();
  const owners = useOwners();

  /**
   * Newest first, so the Application a Staff member just discarded is the
   * first row on the screen.
   */
  const discarded = useMemo(
    () =>
      applications
        .filter(isDiscarded)
        .sort((a, b) =>
          (a.discardedAt ?? '') < (b.discardedAt ?? '') ? 1 : -1,
        ),
    [applications],
  );

  return (
    <DiscardedApplicationsScreen
      now={now}
      applications={discarded}
      categories={categories}
      owners={owners}
      onRestore={(ids) => {
        setDiscarded({ ids, discardedAt: null });
      }}
      onErase={(ids) => {
        erase(ids);
      }}
    />
  );
}
