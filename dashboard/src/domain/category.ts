/**
 * The Category domain: the list an Applicant picks from on the form, and the
 * one a Staff member maintains on Kategorien (`A12`).
 *
 * Order is the array's own order — a Category carries no `position` field, so
 * "move up" is a swap, not a renumbering, and the form renders the list as it
 * is handed over. `A15` records the two attributes the screen edits beyond the
 * name, and the rule that a Category with Applications behind it is
 * deactivated rather than deleted.
 */

export type Category = {
  id: string;
  name: string;
  /** One line under the name on the form. May be empty (`A15`). */
  description: string;
  /** Whether the form offers this Category. Inactive ones stay on file. */
  active: boolean;
};

/**
 * A Category without its id: what the add dialog submits and what
 * `POST /categories` takes, and — as a subset — what `PATCH /categories/{id}`
 * takes (`API.md`). The server mints the id.
 */
export type CategoryDraft = Omit<Category, 'id'>;

/**
 * The named views over the Categories list, the way `APPLICATION_VIEWS` names
 * Anfragen's. "Inaktiv" is a view rather than a filter because deactivating is
 * the alternative to deleting (`A15`) — the list of what a Staff member has
 * taken out of the form is something they go looking for.
 */
export const CATEGORY_VIEWS = ['all', 'active', 'inactive'] as const;

export type CategoryView = (typeof CATEGORY_VIEWS)[number];

export const CATEGORY_NAME_MAX_LENGTH = 60;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 140;

/**
 * Names are what an Applicant reads, so two Categories may not share one.
 * Compared case- and whitespace-insensitively; `exceptId` lets the Category
 * being edited keep its own name.
 */
export function isCategoryNameTaken(
  categories: readonly Category[],
  name: string,
  exceptId?: string,
): boolean {
  const normalised = name.trim().toLocaleLowerCase('de');

  return categories.some(
    (category) =>
      category.id !== exceptId &&
      category.name.trim().toLocaleLowerCase('de') === normalised,
  );
}

/**
 * Swaps a Category with its neighbour and returns the resulting display order
 * as ids — the body of `PUT /api/v1/staff/categories/order` (`API.md`), which
 * takes the whole order rather than a direction so two reorders in a row
 * cannot leave two Categories sharing a position.
 *
 * Returns the order unchanged when the Category is already at that end, so the
 * caller can render the button disabled and still call this without a guard.
 */
export function moveCategory(
  categories: readonly Category[],
  id: string,
  direction: -1 | 1,
): string[] {
  const ids = categories.map((category) => category.id);
  const index = ids.indexOf(id);
  const target = index + direction;

  if (index === -1 || target < 0 || target >= ids.length) {
    return ids;
  }

  const moved = ids[index];
  const displaced = ids[target];

  if (moved === undefined || displaced === undefined) {
    return ids;
  }

  ids[index] = displaced;
  ids[target] = moved;
  return ids;
}

/**
 * How many Applications name each Category. Takes the bare `categoryId` rather
 * than an `Application`, so the Category domain does not depend on the
 * Application one.
 */
export function countApplicationsPerCategory(
  applications: readonly { categoryId: string }[],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const application of applications) {
    counts.set(
      application.categoryId,
      (counts.get(application.categoryId) ?? 0) + 1,
    );
  }

  return counts;
}
