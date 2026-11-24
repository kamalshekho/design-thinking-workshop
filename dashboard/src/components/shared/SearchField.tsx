/**
 * The compact search control in `ApplicationsToolbar`, and on Kategorien.
 * Purely presentational — each screen owns what counts as a hit, and the ⌘K
 * hint it renders is wired by `useSearchShortcut` in the screen above it.
 */

import { SearchLg } from '@untitledui/icons';
import { forwardRef } from 'react';

import { de } from '@/content/de';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  function SearchField({ value, onChange }, ref) {
    return (
      <label className="h-control border-primary bg-primary text-primary focus-within:border-fuut-purple focus-within:ring-fuut-purple/10 flex w-full items-center gap-2 rounded-lg border px-3 text-sm transition-colors duration-150 focus-within:ring-2 sm:w-[280px]">
        <span className="sr-only">{de.filters.search}</span>
        <SearchLg
          className="text-tertiary h-4 w-4 shrink-0"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          value={value}
          placeholder={de.filters.search}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="text-primary placeholder:text-tertiary h-full w-full bg-transparent text-sm focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
        />
        <kbd className="border-primary bg-secondary text-tertiary shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-medium">
          ⌘K
        </kbd>
      </label>
    );
  },
);
