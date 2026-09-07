/**
 * `SearchField` + `FilterPopover`, rendered as the single compact row the
 * premium-SaaS reference uses: a search box with a ⌘K hint, one neutral
 * "Filter" button. The tab strip is a sibling, not a child — the named views
 * are tabs, not filters, and stay out of this component.
 */

import { useRef } from 'react';

import type { Category } from '@/domain/application';
import { useSearchShortcut } from '@/hooks/use-search-shortcut';

import type { ApplicationFilters } from './filterApplications';
import { FilterPopover } from './FilterPopover';
import { SearchField } from './SearchField';

type ApplicationsToolbarProps = {
  filters: ApplicationFilters;
  categories: readonly Category[];
  onChange: (filters: ApplicationFilters) => void;
};

export function ApplicationsToolbar({
  filters,
  categories,
  onChange,
}: ApplicationsToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null);

  useSearchShortcut(searchRef);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField
        ref={searchRef}
        value={filters.search}
        onChange={(search) => {
          onChange({ ...filters, search });
        }}
      />
      <FilterPopover
        filters={filters}
        categories={categories}
        onChange={onChange}
      />
    </div>
  );
}
