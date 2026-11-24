/**
 * Übersicht: the greeting, the three queue cards, and the "Offene Anfragen"
 * panel under them. Assembled here rather than in `App`, so `App` routes
 * between screens and each screen owns its own layout.
 */

import { PageHeader } from '@/components/shared/PageHeader';
import { de } from '@/content/de';
import type { StateChange } from '@/domain/stateChange';

import type { OpenApplicationsPanelProps } from './OpenApplicationsPanel';
import { OpenApplicationsPanel } from './OpenApplicationsPanel';
import { OverviewStats } from './OverviewStats';

type OverviewScreenProps = OpenApplicationsPanelProps & {
  /** The signed-in Staff member's name, for the welcome headline. */
  staffName: string;
  /** The state history behind the three cards' sparklines; only they read it. */
  stateChanges: readonly StateChange[];
};

export function OverviewScreen({
  staffName,
  stateChanges,
  ...panel
}: OverviewScreenProps) {
  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={de.navigation.overview}
          title={de.overview.welcome(staffName)}
          subtitle={de.overview.subtitle}
        />
        <OverviewStats
          applications={panel.applications}
          stateChanges={stateChanges}
          now={panel.now}
        />
      </div>

      <OpenApplicationsPanel {...panel} />
    </div>
  );
}
