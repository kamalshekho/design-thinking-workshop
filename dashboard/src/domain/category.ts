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
 * The named views over the Categories list, the way `APPLICATION_VIEWS` names
 * Anfragen's. "Inaktiv" is a view rather than a filter because deactivating is
 * the alternative to deleting (`A15`) — the list of what a Staff member has
 * taken out of the form is something they go looking for.
 */
export const CATEGORY_VIEWS = ['all', 'active', 'inactive'] as const;

export type CategoryView = (typeof CATEGORY_VIEWS)[number];

export const CATEGORY_NAME_MAX_LENGTH = 60;
export const CATEGORY_DESCRIPTION_MAX_LENGTH = 140;

/** ß and the umlauts, spelled out the way German transliterates them. */
const TRANSLITERATIONS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
};

/**
 * A readable, stable id derived from the name — `Soziale Medien` becomes
 * `soziale-medien`. The backend owns real ids (`A12`); until it exists, a slug
 * keeps the mock set legible in the URL fragment and in test failures.
 */
export function categoryIdFor(name: string, taken: Iterable<string>): string {
  const slug = name
    .toLowerCase()
    .replace(/[äöüß]/g, (character) => TRANSLITERATIONS[character] ?? character)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = slug === '' ? 'kategorie' : slug;
  const used = new Set(taken);

  if (!used.has(base)) {
    return base;
  }

  let suffix = 2;
  while (used.has(`${base}-${String(suffix)}`)) {
    suffix += 1;
  }
  return `${base}-${String(suffix)}`;
}

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
 * Swaps a Category with its neighbour. Returns the list unchanged when the
 * Category is already at that end, so the caller can render the button
 * disabled and still call this without a guard.
 */
export function moveCategory(
  categories: readonly Category[],
  id: string,
  direction: -1 | 1,
): Category[] {
  const index = categories.findIndex((category) => category.id === id);
  const target = index + direction;

  if (index === -1 || target < 0 || target >= categories.length) {
    return [...categories];
  }

  const next = [...categories];
  const moved = next[index];
  const displaced = next[target];

  if (moved === undefined || displaced === undefined) {
    return next;
  }

  next[index] = displaced;
  next[target] = moved;
  return next;
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
