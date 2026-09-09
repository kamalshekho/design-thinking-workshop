/**
 * The Category list as a cache entry. One key, read by Kategorien, by
 * Anfragen's filter and by every row that shows a Category's name, so a
 * rename lands in all three at once.
 */

import { queryOptions } from '@tanstack/react-query';

import { fetchCategories } from '@/api/categories';

import { queryKeys } from './keys';

export const categoriesQuery = queryOptions({
  queryKey: queryKeys.categories,
  queryFn: () => fetchCategories(),
});
