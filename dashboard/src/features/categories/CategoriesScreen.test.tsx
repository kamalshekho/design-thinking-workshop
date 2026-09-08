import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import {
  createMockApplications,
  mockCategories,
} from '@/data/mockApplications';
import type { Application } from '@/domain/application';
import { setDiscarded } from '@/domain/application';
import type { Category } from '@/domain/category';

import { CategoriesScreen } from './CategoriesScreen';

/** The reference date the mock Applications are built against elsewhere. */
const NOW = new Date('2026-09-07T10:00:00.000Z');

const MOCK_APPLICATIONS = createMockApplications(NOW);

/** Mirrors how `App` owns the Categories list and hands it down. */
function Host({
  applications = MOCK_APPLICATIONS,
}: {
  applications?: readonly Application[];
}) {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  return (
    <CategoriesScreen
      categories={categories}
      onCreate={(draft) => {
        setCategories((current) => [
          ...current,
          { id: crypto.randomUUID(), ...draft },
        ]);
      }}
      onEdit={(id, draft) => {
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, ...draft } : category,
          ),
        );
      }}
      onSetActive={(id, active) => {
        setCategories((current) =>
          current.map((category) =>
            category.id === id ? { ...category, active } : category,
          ),
        );
      }}
      onDelete={(id) => {
        setCategories((current) =>
          current.filter((category) => category.id !== id),
        );
      }}
      onReorder={(orderedIds) => {
        setCategories((current) =>
          orderedIds
            .map((id) => current.find((category) => category.id === id))
            .filter((category): category is Category => category !== undefined),
        );
      }}
      applications={applications}
    />
  );
}

/** The Categories on screen, top to bottom — the order the form would use. */
function rowNames(): string[] {
  return screen
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? '')
    .filter((label) => label.endsWith(' bearbeiten'))
    .map((label) => label.replace(/ bearbeiten$/, ''));
}

/** The three tabs carry a count in their label, so they are read by position. */
function tab(index: number): HTMLElement {
  const tabs = within(
    screen.getByRole('tablist', { name: de.categories.title }),
  ).getAllByRole('tab');
  const found = tabs[index];
  if (!found) {
    throw new Error(`No tab at index ${String(index)}`);
  }
  return found;
}

describe('CategoriesScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the Categories in the order the form offers them', () => {
    render(<Host />);

    for (const category of mockCategories) {
      expect(
        screen.getByRole('button', {
          name: de.categories.editOne(category.name),
        }),
      ).toBeInTheDocument();
    }
  });

  it('adds a Category through the dialog', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole('button', { name: de.categories.add }));
    await user.type(
      screen.getByRole('textbox', { name: /^Name/ }),
      'Veranstaltungen',
    );
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.create }),
    );

    expect(
      screen.getByRole('button', {
        name: de.categories.editOne('Veranstaltungen'),
      }),
    ).toBeInTheDocument();
    // Nothing has ever been filed under it, so it counts as unused.
    expect(screen.getByText(de.categories.usageCount(0))).toBeInTheDocument();
  });

  it('refuses a name another Category already carries', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(screen.getByRole('button', { name: de.categories.add }));
    await user.type(
      screen.getByRole('textbox', { name: /^Name/ }),
      'social media',
    );
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.create }),
    );

    expect(
      screen.getByText(de.errors.fields.CATEGORY_NAME_TAKEN),
    ).toBeInTheDocument();
  });

  it('renames a Category from the row', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(
      screen.getByRole('button', {
        name: de.categories.editOne('Etwas anderes'),
      }),
    );

    const field = screen.getByRole('textbox', {
      name: /^Name/,
    });
    await user.clear(field);
    await user.type(field, 'Sonstiges');
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.save }),
    );

    expect(
      screen.getByRole('button', { name: de.categories.editOne('Sonstiges') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: de.categories.editOne('Etwas anderes'),
      }),
    ).not.toBeInTheDocument();
  });

  it('takes a Category out of the form without deleting it', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(
      screen.getByRole('switch', {
        name: de.categories.toggleOne('Etwas anderes'),
      }),
    );

    await user.click(tab(2));

    expect(
      screen.getByRole('button', {
        name: de.categories.editOne('Etwas anderes'),
      }),
    ).toBeInTheDocument();
  });

  it('moves a Category up in the form order', async () => {
    const user = userEvent.setup();
    render(<Host />);

    expect(rowNames()[0]).toBe('Social Media');

    await user.click(
      screen.getByRole('button', {
        name: de.categories.moveUpOne('Redaktion / Öffentlichkeitsarbeit'),
      }),
    );

    expect(rowNames()[0]).toBe('Redaktion / Öffentlichkeitsarbeit');
  });

  it('locks the order while a view or a search hides rows', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.click(tab(1));

    expect(
      screen.getByRole('button', {
        name: de.categories.moveDownOne('Social Media'),
      }),
    ).toBeDisabled();
  });

  it('refuses to delete a Category Applications are filed under', () => {
    render(<Host />);

    expect(
      screen.getByRole('button', {
        name: de.categories.deleteOne('Social Media'),
      }),
    ).toBeDisabled();
  });

  it('leaves a Category undeletable while only a discarded Application names it, and stops counting it', () => {
    const applications = setDiscarded(
      createMockApplications(NOW),
      new Set(
        createMockApplications(NOW)
          .filter((application) => application.categoryId === 'legal')
          .map((application) => application.id),
      ),
      NOW.toISOString(),
    );

    render(<Host applications={applications} />);

    // Two Applications name "Rechtliche Unterstützung" in the mock set, both
    // discarded here: the column drops to zero, the delete button does not
    // unlock (`API.md`, `A15`).
    expect(
      screen.getByRole('button', {
        name: de.categories.deleteOne('Rechtliche Unterstützung'),
      }),
    ).toBeDisabled();
    expect(screen.getByText(de.categories.usageCount(0))).toBeInTheDocument();
  });

  it('deletes a Category nothing is filed under', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Host />);

    await user.click(screen.getByRole('button', { name: de.categories.add }));
    await user.type(
      screen.getByRole('textbox', { name: /^Name/ }),
      'Veranstaltungen',
    );
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.create }),
    );

    await user.click(
      screen.getByRole('button', {
        name: de.categories.deleteOne('Veranstaltungen'),
      }),
    );

    expect(
      screen.queryByRole('button', {
        name: de.categories.editOne('Veranstaltungen'),
      }),
    ).not.toBeInTheDocument();
  });
});
