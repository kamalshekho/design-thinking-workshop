/**
 * PROTOTYPE (issue #109), throwaway. Variant C's navigation below 1024 px: a
 * bar at the bottom with the four screens, in place of the menu button and
 * its drawer. The sign-out sits behind the initials in the top bar.
 */

import { Archive, BarChartSquare02, Inbox01, Tag01 } from '@untitledui/icons';

import { de } from '@/content/de';
import { cx } from '@/utils/cx';

const tabs = [
  { id: 'overview', label: de.navigation.overview, icon: BarChartSquare02 },
  { id: 'applications', label: de.navigation.applications, icon: Inbox01 },
  { id: 'categories', label: de.navigation.categories, icon: Tag01 },
  { id: 'discarded', label: de.navigation.discarded, icon: Archive },
] as const;

export function TabBar({ current }: { current: string }) {
  return (
    <nav
      aria-label={de.navigation.label}
      className="border-secondary bg-primary fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.id === current;
        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            aria-current={active ? 'page' : undefined}
            className={cx(
              'outline-focus-ring flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-2 focus-visible:-outline-offset-2',
              active ? 'text-fuut-purple' : 'text-tertiary',
            )}
          >
            <tab.icon className="size-5" aria-hidden="true" />
            <span className="max-w-full truncate px-1">{tab.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
