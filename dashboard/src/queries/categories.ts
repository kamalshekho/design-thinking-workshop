/**
 * The Category list as a cache entry, and the five writes Kategorien makes.
 *
 * One key, read by Kategorien, by Anfragen's filter and by every row that
 * shows a Category's name, so a rename lands in all three at once.
 *
 * **Every write awaits the server and then invalidates** (ADR-0006), which is
 * the opposite of what an Application edit does, for two reasons the contract
 * names: the server owns a new Category's id and the name's uniqueness — in
 * German collation, against rows the dashboard may not have refetched — and
 * Categories raise no stream event, so nothing would ever echo an optimistic
 * guess back. A Staff member editing four rows can wait for a request; being
 * shown a Category that the backend refused is worse.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  patchCategory,
  putCategoryOrder,
} from '@/api/categories';
import type { Category, CategoryDraft } from '@/domain/category';

import { queryKeys } from './keys';
import { useReportRequestFailure } from './requestFailures';

export const categoriesQuery = queryOptions({
  queryKey: queryKeys.categories,
  queryFn: () => fetchCategories(),
});

const NO_CATEGORIES: readonly Category[] = [];

/** The list a container hands its screen; see `useApplications` on the fallback. */
export function useCategories(): readonly Category[] {
  return useQuery(categoriesQuery).data ?? NO_CATEGORIES;
}

/**
 * The four writes that change one Category or the whole order, each awaiting
 * its request and then refetching the list. They share this hook because they
 * share every one of those steps and differ only in the request — writing five
 * `useMutation` blocks would repeat the invalidation and the reporting five
 * times.
 */
function useCategoryWrite<Variables>(
  write: (variables: Variables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  const report = useReportRequestFailure();

  return useMutation({
    mutationFn: write,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
    onError: (failure) => {
      report(failure);
      /**
       * A refetch on failure too, and not only for tidiness: a rename that was
       * refused because another Staff member has taken the name means the list
       * on screen is already out of date.
       */
      void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCreateCategory() {
  return useCategoryWrite((draft: CategoryDraft) => createCategory(draft));
}

export type CategoryEditVariables = {
  id: string;
  change: Partial<CategoryDraft>;
};

/** The rename, the redescription and the activation toggle: one `PATCH` each. */
export function useEditCategory() {
  return useCategoryWrite(({ id, change }: CategoryEditVariables) =>
    patchCategory(id, change),
  );
}

export function useDeleteCategory() {
  return useCategoryWrite((id: string) => deleteCategory(id));
}

export function useReorderCategories() {
  return useCategoryWrite((orderedIds: readonly string[]) =>
    putCategoryOrder(orderedIds),
  );
}
