/**
 * Übersicht: the greeting, the three queue cards, and the "Offene Anfragen"
 * panel under them. Assembled here rather than in `App`, so `App` routes
 * between screens and each screen owns its own layout.
 */

import { PageHeader } from '@/components/shared/page-header';
import { de } from '@/content/de';
import type {
  Application,
  ApplicationEdit,
  Category,
  Owner,
} from '@/domain/application';

import { OpenApplicationsPanel } from './OpenApplicationsPanel';
import { OverviewStats } from './OverviewStats';

type OverviewScreenProps = {
  /** The signed-in Staff member's name, for the welcome headline. */
  staffName: string;
  applications: readonly Application[];
  onEdit: (id: string, change: ApplicationEdit) => void;
  onDiscard: (ids: ReadonlySet<string>) => void;
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
};

export function OverviewScreen({
  staffName,
  applications,
  onEdit,
  onDiscard,
  categories,
  owners,
  now,
}: OverviewScreenProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={de.navigation.overview}
          title={de.overview.welcome(staffName)}
          subtitle={de.overview.subtitle}
        />
        <OverviewStats applications={applications} now={now} />
      </div>

      <OpenApplicationsPanel
        applications={applications}
        onEdit={onEdit}
        onDiscard={onDiscard}
        categories={categories}
        owners={owners}
        now={now}
      />
    </div>
  );
}
