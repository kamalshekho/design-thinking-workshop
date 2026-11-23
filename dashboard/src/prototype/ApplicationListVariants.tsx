/**
 * PROTOTYPE (issue #109), throwaway. The two list shapes that replace the
 * Applications table on a narrow screen:
 *
 * - `ApplicationCards` (variant B, below 768 px): one card per Application;
 * - `ApplicationInbox` (variant C, below 1024 px): mail-client rows, two
 *   lines each, edge to edge.
 *
 * Both drop the checkbox column and the per-row discard. Bulk work happens at
 * the desk (`A29`).
 */

import type { ReactNode } from 'react';
import { useMemo } from 'react';

import {
  PLAIN_STATUS_BADGE_CLASSNAME,
  STATUS_BADGE_COLORS,
  STATUS_DOT_CLASSNAME,
} from '@/components/application/application-status/status-styles';
import { Avatar } from '@/components/base/avatar/avatar';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { Dot } from '@/components/foundations/dot-icon';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';
import { isUnassigned } from '@/domain/application';
import { cx } from '@/utils/cx';
import { daysSince } from '@/utils/dates';
import { initialsOf } from '@/utils/initials';

export type ListVariantProps = {
  applications: readonly Application[];
  categories: readonly Category[];
  owners: readonly Owner[];
  now: Date;
  oldestFirst?: boolean;
  onSelect: (application: Application) => void;
  activeId?: string | null;
  emptyState?: ReactNode;
};

function useRows({
  applications,
  categories,
  owners,
  oldestFirst,
}: ListVariantProps) {
  return useMemo(() => {
    const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
    const ownerNames = new Map(owners.map((o) => [o.id, o.name]));
    const sorted = [...applications].sort((a, b) => {
      const result =
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return oldestFirst === true ? result : -result;
    });
    return sorted.map((application) => ({
      application,
      category:
        categoryNames.get(application.categoryId) ?? application.categoryId,
      owner:
        application.ownerId === null
          ? null
          : (ownerNames.get(application.ownerId) ?? application.ownerId),
    }));
  }, [applications, categories, owners, oldestFirst]);
}

export function ApplicationCards(props: ListVariantProps) {
  const rows = useRows(props);
  const { now, onSelect, activeId, emptyState } = props;

  if (rows.length === 0) {
    return <div className="bg-primary rounded-xl border">{emptyState}</div>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map(({ application, category, owner }) => {
        const unread = isUnassigned(application);
        return (
          <li key={application.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(application);
              }}
              className={cx(
                'border-secondary bg-primary outline-focus-ring flex w-full cursor-pointer flex-col gap-2 rounded-xl border p-4 text-left shadow-xs focus-visible:outline-2',
                unread && 'bg-bg-unread border-fuut-purple/30',
                application.id === activeId && 'ring-fuut-purple ring-2',
              )}
            >
              <span className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className={cx(
                    'mt-2 size-1.5 shrink-0 rounded-full',
                    unread ? 'bg-fuut-purple' : 'bg-transparent',
                  )}
                />
                <span
                  className={cx(
                    'min-w-0 flex-1 truncate text-[15px]',
                    unread
                      ? 'text-primary font-semibold'
                      : 'text-secondary font-medium',
                  )}
                >
                  {application.name}
                </span>
                <BadgeWithDot
                  size="sm"
                  type="pill-color"
                  color={STATUS_BADGE_COLORS[application.status]}
                  className={cx(PLAIN_STATUS_BADGE_CLASSNAME, 'shrink-0')}
                >
                  {de.statuses[application.status]}
                </BadgeWithDot>
              </span>
              <span className="text-tertiary truncate pl-3.5 text-sm">
                {category} · {de.weeklyTimes[application.weeklyTime]}
              </span>
              <span className="flex items-center gap-2 pl-3.5 text-sm">
                <Avatar
                  size="xs"
                  alt=""
                  initials={owner === null ? undefined : initialsOf(owner)}
                />
                <span
                  className={cx(
                    'min-w-0 flex-1 truncate',
                    owner === null ? 'text-quaternary' : 'text-secondary',
                  )}
                >
                  {owner ?? de.application.unassigned}
                </span>
                <span className="text-tertiary shrink-0 text-xs tabular-nums">
                  {de.application.daysAgo(
                    daysSince(application.submittedAt, now),
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ApplicationInbox(props: ListVariantProps) {
  const rows = useRows(props);
  const { now, onSelect, activeId, emptyState } = props;

  if (rows.length === 0) {
    return <div className="bg-primary border-y">{emptyState}</div>;
  }

  return (
    <ul className="border-secondary bg-primary divide-secondary -mx-4 divide-y border-y sm:mx-0 sm:rounded-xl sm:border">
      {rows.map(({ application, category, owner }) => {
        const unread = isUnassigned(application);
        return (
          <li key={application.id}>
            <button
              type="button"
              onClick={() => {
                onSelect(application);
              }}
              className={cx(
                'outline-focus-ring active:bg-primary_hover flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2',
                application.id === activeId && 'bg-secondary',
              )}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'size-2 shrink-0 rounded-full',
                  unread ? 'bg-fuut-purple' : 'bg-transparent',
                )}
              />
              <span aria-hidden="true" className="flex">
                <Avatar size="md" initials={initialsOf(application.name)} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline gap-2">
                  <span
                    className={cx(
                      'min-w-0 flex-1 truncate',
                      unread
                        ? 'text-primary font-semibold'
                        : 'text-secondary font-medium',
                    )}
                  >
                    {application.name}
                  </span>
                  <span
                    className={cx(
                      'shrink-0 text-xs tabular-nums',
                      unread
                        ? 'text-fuut-purple font-semibold'
                        : 'text-tertiary',
                    )}
                  >
                    {de.application.daysAgo(
                      daysSince(application.submittedAt, now),
                    )}
                  </span>
                </span>
                <span className="text-tertiary flex items-center gap-1.5 text-sm">
                  <Dot
                    size="sm"
                    aria-hidden="true"
                    className={cx(
                      'shrink-0',
                      STATUS_DOT_CLASSNAME[application.status],
                    )}
                  />
                  <span className="truncate">
                    {de.statuses[application.status]} · {category}
                    {owner === null ? '' : ` · ${owner}`}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
