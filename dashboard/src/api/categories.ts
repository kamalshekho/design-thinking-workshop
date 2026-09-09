/**
 * The Category list, in the order the form offers it (`API.md`,
 * "GET /api/v1/staff/categories").
 *
 * The order *is* the array's order — a Category carries no position on this
 * side, so Kategorien's arrows hand the whole order back as ids rather than a
 * number per row (`domain/category.ts`).
 *
 * The five writes Kategorien makes await the server rather than going
 * optimistic: the server owns the id and the name's uniqueness, and Categories
 * raise no stream event, so nothing would echo an optimistic guess back
 * (ADR-0006).
 */

import type { Category, CategoryDraft } from '@/domain/category';

import { request, requestNoContent } from './transport';

type CategoryWire = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

function toCategory(wire: CategoryWire): Category {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    active: wire.active,
  };
}

export async function fetchCategories(): Promise<Category[]> {
  const { categories } = await request<{ categories: CategoryWire[] }>(
    'GET',
    '/categories',
  );

  return categories.map(toCategory);
}

/**
 * Appends a Category (`API.md`, `POST /categories`). `201` with the created
 * Category, whose id the server mints — nothing on this side invents one.
 *
 * A name another Category already holds is `400 VALIDATION_FAILED` with the
 * field code `CATEGORY_NAME_TAKEN`. The dialog checks the same rule against
 * the list it holds, and the two say the same German sentence; the backend's
 * answer is the one that counts, because it compares in German collation
 * against rows the dashboard may not have refetched yet.
 */
export async function createCategory(draft: CategoryDraft): Promise<Category> {
  return toCategory(await request<CategoryWire>('POST', '/categories', draft));
}

/**
 * Any subset of `name`, `description` and `active` (`API.md`). One function for
 * the rename, the redescription and the activation toggle, because the wire has
 * one endpoint for all three — which is also why the caller passes only the
 * keys it means.
 */
export async function patchCategory(
  id: string,
  change: Partial<CategoryDraft>,
): Promise<Category> {
  return toCategory(
    await request<CategoryWire>(
      'PATCH',
      `/categories/${encodeURIComponent(id)}`,
      change,
    ),
  );
}

/**
 * `204` when nothing references the Category, `409 CATEGORY_IN_USE` when any
 * Application names it — discarded ones included. Kategorien disables the
 * button in that case too, and the duplication is deliberate (`A15`): the rule
 * belongs to the data, not to a button.
 */
export async function deleteCategory(id: string): Promise<void> {
  await requestNoContent('DELETE', `/categories/${encodeURIComponent(id)}`);
}

/**
 * The whole display order, as ids (`API.md`, `PUT /categories/order`). Not a
 * direction: the server does not have to guess which state "up" was relative
 * to, and two reorders in a row cannot leave two Categories sharing a
 * position. An order that is not a permutation of the list is
 * `400 VALIDATION_FAILED` with `ORDER_INCOMPLETE`.
 */
export async function putCategoryOrder(
  ids: readonly string[],
): Promise<Category[]> {
  const { categories } = await request<{ categories: CategoryWire[] }>(
    'PUT',
    '/categories/order',
    { ids },
  );

  return categories.map(toCategory);
}
