/**
 * Kategorie and Status, tucked behind a single "Filter" trigger instead of two
 * permanently visible selects. Selecting a value writes straight through
 * `onChange` — there is no second, popover-local filter state to keep in
 * sync. "Filter zurücksetzen" only clears `categoryId`/`status`; Search and
 * the current ViewTab are untouched.
 */

import { ChevronDown, FilterLines } from '@untitledui/icons';
import { useEffect, useRef, useState } from 'react';

import { de } from '@/content/de';
import type { ApplicationStatus, Category } from '@/domain/application';
import { APPLICATION_STATUSES } from '@/domain/application';

import type { ApplicationFilters } from './filterApplications';

type FilterPopoverProps = {
  filters: ApplicationFilters;
  categories: readonly Category[];
  onChange: (filters: ApplicationFilters) => void;
};

const selectClass =
  'w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary focus:border-fuut-purple focus:ring-2 focus:ring-fuut-purple/10 focus:outline-none';

export function FilterPopover({
  filters,
  categories,
  onChange,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeCount =
    (filters.categoryId !== null ? 1 : 0) + (filters.status !== null ? 1 : 0);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="outline-focus-ring h-control border-primary bg-primary text-primary hover:bg-primary_hover flex items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <FilterLines className="text-secondary h-4 w-4" aria-hidden="true" />
        {de.filters.filter}
        {activeCount > 0 ? (
          <span className="bg-utility-brand-50 text-fuut-purple flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium">
            {activeCount}
          </span>
        ) : null}
        <ChevronDown className="text-secondary h-4 w-4" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={de.filters.filter}
          className="popover-entering border-secondary bg-primary absolute top-[calc(100%+8px)] left-0 z-10 w-[320px] max-w-[calc(100vw-60px)] rounded-xl border p-4 shadow-lg sm:right-0 sm:left-auto"
        >
          <p className="text-primary text-sm font-semibold">
            {de.filters.filter}
          </p>

          <label className="mt-3 flex flex-col gap-1">
            <span className="text-secondary text-xs font-medium">
              {de.filters.category}
            </span>
            <select
              value={filters.categoryId ?? ''}
              onChange={(event) => {
                onChange({
                  ...filters,
                  categoryId:
                    event.target.value === '' ? null : event.target.value,
                });
              }}
              className={selectClass}
            >
              <option value="">{de.filters.all}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 flex flex-col gap-1">
            <span className="text-secondary text-xs font-medium">
              {de.filters.status}
            </span>
            <select
              value={filters.status ?? ''}
              onChange={(event) => {
                onChange({
                  ...filters,
                  status:
                    event.target.value === ''
                      ? null
                      : (event.target.value as ApplicationStatus),
                });
              }}
              className={selectClass}
            >
              <option value="">{de.filters.all}</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {de.statuses[status]}
                </option>
              ))}
            </select>
          </label>

          <div className="border-primary mt-4 flex items-center justify-between border-t pt-3">
            <button
              type="button"
              onClick={() => {
                onChange({ ...filters, categoryId: null, status: null });
              }}
              className="text-secondary hover:text-primary text-sm font-medium"
            >
              {de.filters.reset}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="bg-text-primary hover:bg-text-secondary rounded-lg px-3 py-2 text-sm font-medium text-white"
            >
              {de.filters.apply}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
