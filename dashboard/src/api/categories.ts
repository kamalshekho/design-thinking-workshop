/**
 * The Category list, in the order the form offers it (`API.md`,
 * "GET /api/v1/staff/categories").
 *
 * The order *is* the array's order — a Category carries no position on this
 * side, so Kategorien's arrows hand the whole order back as ids rather than a
 * number per row (`domain/category.ts`).
 *
 * Only the read is here. The five writes Kategorien makes are issue #38, and
 * they await the server rather than going optimistic: Categories raise no
 * stream event, so nothing echoes them back (ADR-0006).
 */

import type { Category } from '@/domain/category';

import { request } from './transport';

type CategoryWire = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export async function fetchCategories(): Promise<Category[]> {
  const { categories } = await request<{ categories: CategoryWire[] }>(
    'GET',
    '/categories',
  );

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    active: category.active,
  }));
}
