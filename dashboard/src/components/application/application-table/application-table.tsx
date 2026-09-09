/**
 * The Applications list.
 *
 * Clone path: `components/application/table/table-example.tsx`. The example's
 * markup — card, sortable headings, avatar cell, dot badge — is kept; its
 * hard-coded rows are replaced by the `Application` set the screen hands in,
 * and the columns are the ones `de.columns` names. The example's selection
 * checkbox column, per-row actions and card pagination are all kept, so Staff
 * can act on one or several Applications and page through the queue. All three
 * are opt-in, which is what lets every screen share this one component rather
 * than each growing its own table: Anfragen and Übersicht both take the
 * selection column and a discard action, Aussortiert takes the same column
 * with restore and permanent delete instead, and only the pager stays off in
 * Übersicht, whose list is already cut to five rows.
 *
 * The trailing actions are `rowActions` — a list of descriptors rather than
 * one `onDelete` callback, because the three screens do not agree on what a
 * row offers, and because the label and the confirmation belong to the screen
 * that owns the action, not to this component.
 *
 * `selectionBehavior="toggle"` is the reference's own setting: it renders the
 * leading checkbox column (header checkbox = whole page, row checkbox = that
 * row), and leaves a plain click on the row body to `onRowAction`, which opens
 * the drawer. Selection therefore never fights the row click.
 *
 * Selection is tracked across pages: `selectedIds` holds every checked id,
 * while the table itself only ever sees the ids on the current page.
 *
 * A row nobody owns reads as unread (`A14`): a dot at the row's left edge, the
 * applicant's name in bold, and a tinted row. Assigning an Owner in the drawer
 * flips the same row to its plain, read state, and clearing the Owner flips it
 * back — the style is derived from `ownerId` on every render, never stored.
 * `unreadState` turns the emphasis off for the one list where it says nothing:
 * in the bin, "nobody has taken this on" is no longer a call to act (`A17`).
 *
 * The row whose Application the drawer shows carries a rail at its leading
 * edge (`activeId`), which is what ties the panel to a row without competing
 * with either the unread tint or the checkbox selection.
 */

import type { FC, Key, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { Selection, SortDescriptor } from 'react-aria-components';

import {
  PLAIN_STATUS_BADGE_CLASSNAME,
  STATUS_BADGE_COLORS,
} from '@/components/application/application-status/status-styles';
import { PaginationCardDefault } from '@/components/application/pagination/pagination';
import { Table, TableCard } from '@/components/application/table/table';
import { Avatar } from '@/components/base/avatar/avatar';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { de } from '@/content/de';
import type { Application, Category, Owner } from '@/domain/application';
import { isUnassigned, WEEKLY_TIMES } from '@/domain/application';
import { cx } from '@/utils/cx';
import { daysSince } from '@/utils/dates';
import { initialsOf } from '@/utils/initials';

/**
 * One trailing icon button on every row. The screen owns the wording, so a
 * table on Anfragen can offer "aussortieren" and Aussortiert "endgültig
 * löschen" without either string living in this component.
 */
export type ApplicationRowAction = {
  /** Stable key for the button; not shown. */
  id: string;
  icon: FC<{ className?: string }>;
  /** Accessible name of the icon-only button. */
  label: (application: Application) => string;
  /**
   * Asked through `window.confirm` before the action runs. Omitted for an
   * action a Staff member can simply undo — restoring an Application is one
   * click away from being discarded again, so it asks nothing.
   */
  confirm?: (application: Application) => string;
  /** Renders the button in the danger colour. */
  destructive?: boolean;
  onAction: (application: Application) => void;
};

type ApplicationTableProps = {
  applications: readonly Application[];
  categories: readonly Category[];
  owners: readonly Owner[];
  /** The reference date the relative age under each date is read against. */
  now: Date;
  /** The "Lange offen" queue reads oldest-first; every other view is newest-first. */
  oldestFirst?: boolean;
  /**
   * Off by default: Übersicht's preview is already cut to five rows by its
   * caller, so a pager under it would only ever read "Previous | 1 | Next".
   */
  paginated?: boolean;
  /**
   * Opens the row's Application. Omitted where a row has nothing behind it —
   * Aussortiert has no drawer — and then a row is not clickable at all.
   */
  onSelect?: (application: Application) => void;
  /**
   * Ids checked via the row/header checkboxes. Controlled by the screen so
   * the bulk buttons above the table can read the same set. Selection and the
   * trailing actions only render when `rowActions` is non-empty.
   */
  selectedIds?: ReadonlySet<string>;
  onSelectedIdsChange?: (ids: ReadonlySet<string>) => void;
  rowActions?: readonly ApplicationRowAction[];
  /**
   * Emphasise Applications without an Owner as unread (`A14`). On by default;
   * Aussortiert turns it off, where the emphasis would point at nothing.
   */
  unreadState?: boolean;
  /** Shown in place of the rows while the set is empty. */
  emptyState?: ReactNode;
  /**
   * The Application the drawer currently shows, marked with a rail at the
   * row's leading edge. Distinct from `selectedIds`, which is the checkbox
   * selection: one row is open, any number of rows can be checked.
   */
  activeId?: string | null;
  ariaLabel: string;
};

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/** Rows per page, matching the reference table card. */
const PAGE_SIZE = 10;

export function ApplicationTable({
  applications,
  categories,
  owners,
  now,
  oldestFirst = false,
  paginated = false,
  onSelect,
  selectedIds,
  onSelectedIdsChange,
  rowActions = [],
  unreadState = true,
  emptyState,
  activeId = null,
  ariaLabel,
}: ApplicationTableProps) {
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'submittedAt',
    direction: oldestFirst ? 'ascending' : 'descending',
  });

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );
  // The whole Owner, not just the name: the Zuständigkeit column also reads
  // the photo off it.
  const ownersById = useMemo(
    () => new Map(owners.map((owner) => [owner.id, owner])),
    [owners],
  );

  const sortValues = useMemo<
    Record<string, (application: Application) => string | number>
  >(
    () => ({
      name: (application) => application.name,
      email: (application) => application.email,
      category: (application) =>
        categoryNames.get(application.categoryId) ?? application.categoryId,
      // Sorted by the band's own order — 1–2 hours before "irregular" —
      // rather than by its label or its spelling.
      weeklyTime: (application) => WEEKLY_TIMES.indexOf(application.weeklyTime),
      status: (application) => de.statuses[application.status],
      submittedAt: (application) => new Date(application.submittedAt).getTime(),
      owner: (application) =>
        application.ownerId === null
          ? ''
          : (ownersById.get(application.ownerId)?.name ?? application.ownerId),
    }),
    [categoryNames, ownersById],
  );

  const sorted = useMemo(() => {
    const getSortValue = sortValues[String(sortDescriptor.column)];

    if (!getSortValue) {
      return [...applications];
    }

    return [...applications].sort((a, b) => {
      const first = getSortValue(a);
      const second = getSortValue(b);
      const result =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).localeCompare(String(second), 'de');

      return sortDescriptor.direction === 'descending' ? -result : result;
    });
  }, [applications, sortDescriptor, sortValues]);

  const selectionEnabled = rowActions.length > 0;

  const [page, setPage] = useState(1);

  // A new filter/view hands in a different set — start it at its first page.
  // Adjusted during render rather than in an effect so the first paint of the
  // new set is already page one, with no flash of a stale page.
  const [pagedApplications, setPagedApplications] =
    useState<readonly Application[]>(applications);
  if (pagedApplications !== applications) {
    setPagedApplications(applications);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      paginated
        ? sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
        : sorted,
    [sorted, currentPage, paginated],
  );

  /** Only this page's ids reach the table; the rest of the selection is held aside. */
  const pageIds = useMemo(
    () => pageItems.map((application) => application.id),
    [pageItems],
  );
  const selectedOnPage = useMemo(
    () => new Set(pageIds.filter((id) => selectedIds?.has(id))),
    [pageIds, selectedIds],
  );

  return (
    <TableCard.Root>
      <Table
        aria-label={ariaLabel}
        selectionMode={selectionEnabled ? 'multiple' : 'none'}
        selectionBehavior="toggle"
        {...(selectionEnabled
          ? {
              selectedKeys: selectedOnPage,
              onSelectionChange: (keys: Selection) => {
                const next = new Set(selectedIds ?? []);
                // Re-derive this page's part of the selection from scratch,
                // leaving ids checked on other pages untouched.
                for (const id of pageIds) {
                  next.delete(id);
                }
                for (const key of keys === 'all' ? pageIds : keys) {
                  next.add(String(key));
                }
                onSelectedIdsChange?.(next);
              },
            }
          : {})}
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        {...(onSelect
          ? {
              onRowAction: (key: Key) => {
                const application = applications.find(
                  (candidate) => candidate.id === String(key),
                );
                if (application) {
                  onSelect(application);
                }
              },
            }
          : {})}
      >
        <Table.Header>
          <Table.Head
            id="name"
            label={de.columns.name}
            isRowHeader
            allowsSorting
            className="w-full max-w-full md:min-w-52"
          />
          <Table.Head id="email" label={de.columns.email} allowsSorting />
          <Table.Head id="category" label={de.columns.category} allowsSorting />
          <Table.Head
            id="weeklyTime"
            label={de.columns.weeklyTime}
            allowsSorting
          />
          <Table.Head id="status" label={de.columns.status} allowsSorting />
          <Table.Head
            id="submittedAt"
            label={de.columns.submittedAt}
            allowsSorting
          />
          <Table.Head id="owner" label={de.columns.owner} allowsSorting />
          {selectionEnabled ? (
            <Table.Head id="actions" aria-label={de.columns.actions} />
          ) : null}
        </Table.Header>

        {/* `activeId` is read by the row renderer but is not part of `items`,
            so the collection has to be told to re-render rows when it moves. */}
        <Table.Body
          items={pageItems}
          dependencies={[activeId]}
          {...(emptyState === undefined
            ? {}
            : { renderEmptyState: () => emptyState })}
        >
          {(application) => {
            const unassigned = unreadState && isUnassigned(application);
            const owner =
              application.ownerId === null
                ? null
                : (ownersById.get(application.ownerId) ?? null);
            const ownerName =
              application.ownerId === null
                ? null
                : (owner?.name ?? application.ownerId);

            return (
              <Table.Row
                id={application.id}
                className={cx(
                  onSelect && 'cursor-pointer',
                  unassigned && 'bg-bg-unread',
                  // A rail rather than a tint: the row may already be tinted
                  // for unread or for the checkbox selection, and neither of
                  // those meanings may be overwritten by "this one is open".
                  //
                  // The rail hangs off the first cell, not off the `<tr>`: a
                  // pseudo-element on a table row is wrapped in an anonymous
                  // table cell by CSS table fixup, which pushed every real
                  // cell of the open row one column to the right.
                  application.id === activeId && 'row-rail',
                )}
              >
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    {/*
                     * Decorative: the Zuständigkeit column already says
                     * "Nicht zugewiesen" in words, so a screen reader would
                     * only hear the same fact twice — and any text here would
                     * land in the row header's accessible name.
                     */}
                    <span
                      aria-hidden="true"
                      className={cx(
                        'size-1.5 shrink-0 rounded-full',
                        unassigned ? 'bg-fuut-purple' : 'bg-transparent',
                      )}
                    />
                    {/* Initials repeat the name beside them — decorative. */}
                    <span aria-hidden="true" className="flex">
                      <Avatar
                        size="sm"
                        initials={initialsOf(application.name)}
                      />
                    </span>
                    <p
                      className={cx(
                        'text-sm whitespace-nowrap',
                        unassigned
                          ? 'text-primary font-semibold'
                          : 'text-secondary font-medium',
                      )}
                    >
                      {application.name}
                    </p>
                  </div>
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {application.email}
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {categoryNames.get(application.categoryId) ??
                    application.categoryId}
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap">
                  {de.weeklyTimes[application.weeklyTime]}
                </Table.Cell>

                <Table.Cell>
                  <BadgeWithDot
                    size="sm"
                    type="pill-color"
                    color={STATUS_BADGE_COLORS[application.status]}
                    className={PLAIN_STATUS_BADGE_CLASSNAME}
                  >
                    {de.statuses[application.status]}
                  </BadgeWithDot>
                </Table.Cell>

                <Table.Cell className="whitespace-nowrap tabular-nums">
                  <time dateTime={application.submittedAt}>
                    {dateFormatter.format(new Date(application.submittedAt))}
                  </time>
                  <span className="text-tertiary block text-xs leading-5">
                    {de.application.daysAgo(
                      daysSince(application.submittedAt, now),
                    )}
                  </span>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-2.5">
                    {/* Initials when an Owner is assigned, and the empty-user
                        glyph when nobody is. There is no photo to show: the
                        wire carries none (`API.md`). `alt=""` either way — the
                        name is right beside it, so a screen reader would only
                        hear it twice. */}
                    <Avatar
                      size="xs"
                      alt=""
                      initials={
                        ownerName === null ? undefined : initialsOf(ownerName)
                      }
                    />
                    <span
                      className={cx(
                        'whitespace-nowrap',
                        ownerName === null && 'text-quaternary',
                      )}
                    >
                      {ownerName ?? de.application.unassigned}
                    </span>
                  </div>
                </Table.Cell>

                {selectionEnabled ? (
                  <Table.Cell>
                    {/* 8px between adjacent icon buttons, so a row with two
                        actions cannot be mis-clicked into the wrong one. */}
                    <div className="flex items-center gap-2">
                      {rowActions.map((action) => (
                        <button
                          key={action.id}
                          type="button"
                          aria-label={action.label(application)}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (
                              action.confirm === undefined ||
                              window.confirm(action.confirm(application))
                            ) {
                              action.onAction(application);
                            }
                          }}
                          className={cx(
                            'text-fg-quaternary outline-focus-ring hover:bg-primary_hover cursor-pointer rounded-md p-1.5 transition duration-100 ease-linear focus-visible:outline-2 focus-visible:outline-offset-2',
                            action.destructive
                              ? 'hover:text-fg-error-primary'
                              : 'hover:text-fg-brand-primary_alt',
                          )}
                        >
                          <action.icon className="size-4" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </Table.Cell>
                ) : null}
              </Table.Row>
            );
          }}
        </Table.Body>
      </Table>

      {/* No pager under an empty table: with no rows it reads
          "Zurück | 1 | Weiter" under the empty state, which offers a page
          that does not exist and makes the screen look half-loaded (issue #53). */}
      {paginated && sorted.length > 0 ? (
        <PaginationCardDefault
          page={currentPage}
          total={totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </TableCard.Root>
  );
}
