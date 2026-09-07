/**
 * The filter bar for Übersicht's "Offene Anfragen" panel: search, Category,
 * owner. No status or period filter, and no reset button here — those stay
 * either in Anfragen's own `FilterBar` or in the panel's header, which shows
 * reset only while a filter is active.
 *
 * Styled as a compact pill row (trigger shows the active value, no caption
 * above it) rather than labelled form fields — Category and owner open as a
 * checkmarked option menu via the Radix-backed `Select` instead of a native
 * `<select>`.
 */

import { SearchLg } from '@untitledui/icons';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { de } from '@/content/de';
import type { Category, Owner } from '@/domain/application';

import type { OpenApplicationsFilters } from './selectOpenApplications';

type OpenApplicationsFilterBarProps = {
  filters: OpenApplicationsFilters;
  categories: readonly Category[];
  owners: readonly Owner[];
  onChange: (filters: OpenApplicationsFilters) => void;
};

export function OpenApplicationsFilterBar({
  filters,
  categories,
  owners,
  onChange,
}: OpenApplicationsFilterBarProps) {
  // Radix `Select.Item` rejects an empty-string value (it is reserved
  // internally to mean "no selection"), so the "all" option uses a sentinel
  // that is mapped back to `null` on change.
  const ALL_VALUE = 'all';

  const categoryOptions = [
    { value: ALL_VALUE, label: de.overview.openApplications.allCategories },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const ownerOptions = [
    { value: ALL_VALUE, label: de.overview.openApplications.allOwners },
    { value: 'unassigned', label: de.application.unassigned },
    ...owners.map((owner) => ({ value: owner.id, label: owner.name })),
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="relative block sm:max-w-[320px] sm:min-w-[280px] sm:flex-1">
        <SearchLg
          className="text-text-quaternary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label={de.filters.search}
          value={filters.search}
          placeholder={de.overview.openApplications.searchPlaceholder}
          onChange={(event) => {
            onChange({ ...filters, search: event.target.value });
          }}
          className="border-border-primary bg-bg-primary text-text-primary placeholder:text-tertiary focus:border-fuut-purple focus:ring-fuut-purple/10 h-control w-full rounded-lg border pr-3 pl-9 text-sm transition-shadow focus:ring-[3px] focus:outline-none"
        />
      </span>

      <Select
        value={filters.categoryId ?? ALL_VALUE}
        onValueChange={(value) => {
          onChange({
            ...filters,
            categoryId: value === ALL_VALUE ? null : value,
          });
        }}
      >
        <SelectTrigger
          aria-label={de.filters.category}
          className="h-control sm:w-[200px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {categoryOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.ownerId ?? ALL_VALUE}
        onValueChange={(value) => {
          onChange({
            ...filters,
            ownerId: value === ALL_VALUE ? null : value,
          });
        }}
      >
        <SelectTrigger
          aria-label={de.overview.openApplications.ownerLabel}
          className="h-control sm:w-[200px]"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ownerOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
