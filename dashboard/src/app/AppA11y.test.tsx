import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { expectNoA11yViolations } from '@/test/a11y';
import { renderApp, renderSignedIn } from '@/test/renderApp';
import type { StubbedApi } from '@/test/stubApi';
import { REFERENCE_DATE, stubApi } from '@/test/stubApi';
import { setViewportWidth } from '@/test/viewport';

const PHONE_WIDTH = 375;

/**
 * Automated accessibility checks across every dashboard screen and open overlay
 * in jsdom. `color-contrast` is the only disabled rule (`src/test/a11y.ts`).
 *
 * Every assertion runs against `document.body` so portaled overlays
 * (React Aria modals, drawers, dialogs, popovers) are audited alongside the
 * screen underneath them.
 */
describe('App accessibility', () => {
  let api: StubbedApi;

  beforeEach(() => {
    api = stubApi();
  });

  afterEach(() => {
    window.location.hash = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function seedDiscardedApplication(): string {
    const target = api.applications[0];
    if (target === undefined) {
      throw new Error('Expected at least one mock application');
    }
    api.applications = api.applications.map((row, index) =>
      index === 0 ? { ...row, discardedAt: REFERENCE_DATE.toISOString() } : row,
    );
    return target.name;
  }

  async function renderScreen(hash: string): Promise<void> {
    window.location.hash = hash;
    await renderSignedIn();
  }

  describe('screens', () => {
    it('has no axe violations on LoginScreen before sign-in', async () => {
      api.signedIn = false;

      renderApp();

      expect(
        await screen.findByRole('heading', { name: de.auth.title }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations on the overview screen', async () => {
      await renderScreen('#overview');

      expect(
        screen.getByRole('region', {
          name: de.overview.openApplications.title,
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations on the applications screen', async () => {
      await renderScreen('#applications');

      expect(
        screen.getByRole('heading', { name: de.applications.title }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations on the categories screen', async () => {
      await renderScreen('#categories');

      expect(
        screen.getByRole('heading', { name: de.categories.title }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations on the discarded screen with data', async () => {
      const discardedName = seedDiscardedApplication();
      await renderScreen('#discarded');

      expect(screen.getByText(discardedName)).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });
  });

  describe('open overlays', () => {
    it('has no axe violations with ApplicationDrawer open on wide viewport', async () => {
      const user = userEvent.setup();
      await renderScreen('#applications');

      await user.click(screen.getByText('Mara Weber'));

      expect(
        await screen.findByLabelText(de.detail.internalNotes),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with ApplicationPage open on narrow viewport', async () => {
      const user = userEvent.setup();
      setViewportWidth(PHONE_WIDTH);
      await renderScreen('#applications');

      await user.click(screen.getByText('Mara Weber'));

      expect(
        await screen.findByRole('button', { name: de.detail.backLabel }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with CategoryDialog open for creating a category', async () => {
      const user = userEvent.setup();
      await renderScreen('#categories');

      await user.click(screen.getByRole('button', { name: de.categories.add }));

      expect(
        await screen.findByRole('dialog', {
          name: de.categories.dialog.createTitle,
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with CategoryDialog open for editing a category', async () => {
      const user = userEvent.setup();
      await renderScreen('#categories');

      await user.click(
        screen.getByRole('button', {
          name: de.categories.editOne('Social Media'),
        }),
      );

      expect(
        await screen.findByRole('dialog', {
          name: de.categories.dialog.editTitle,
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with ConfirmDialog open for deleting a category', async () => {
      const user = userEvent.setup();
      const unusedName = 'Fundraising';
      api.categories = [
        ...api.categories,
        {
          id: 'fundraising',
          name: unusedName,
          description: 'Spendenaktionen koordinieren.',
          active: true,
        },
      ];
      await renderScreen('#categories');

      await user.click(
        screen.getByRole('button', {
          name: de.categories.deleteOne(unusedName),
        }),
      );

      expect(
        await screen.findByRole('alertdialog', {
          name: de.categories.confirmDelete(unusedName),
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with ConfirmDialog open for erasing a single discarded application', async () => {
      const user = userEvent.setup();
      const discardedName = seedDiscardedApplication();
      await renderScreen('#discarded');

      await user.click(
        screen.getByRole('button', {
          name: de.discarded.eraseOne(discardedName),
        }),
      );

      expect(
        await screen.findByRole('alertdialog', {
          name: de.discarded.confirmEraseOne(discardedName),
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with ConfirmDialog open for bulk erasing discarded applications', async () => {
      const user = userEvent.setup();
      seedDiscardedApplication();
      await renderScreen('#discarded');

      const rowCheckbox = screen.getAllByRole('checkbox')[1];
      expect(rowCheckbox).toBeDefined();
      await user.click(rowCheckbox!);

      await user.click(
        screen.getByRole('button', { name: de.discarded.eraseSelected(1) }),
      );

      expect(
        await screen.findByRole('alertdialog', {
          name: de.discarded.confirmEraseSelected(1),
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with DiscardSelectedDialog open for bulk discarding applications', async () => {
      const user = userEvent.setup();
      await renderScreen('#applications');

      const rowCheckbox = screen.getAllByRole('checkbox')[1];
      expect(rowCheckbox).toBeDefined();
      await user.click(rowCheckbox!);

      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardSelected(1),
        }),
      );

      expect(
        await screen.findByRole('alertdialog', {
          name: de.applications.confirmDiscardSelected(1),
        }),
      ).toBeInTheDocument();

      await expectNoA11yViolations(document.body);
    });

    it('has no axe violations with FilterPopover open in applications toolbar', async () => {
      const user = userEvent.setup();
      await renderScreen('#applications');

      await user.click(screen.getByRole('button', { name: de.filters.filter }));

      await waitFor(() => {
        expect(screen.getByLabelText(de.filters.status)).toBeInTheDocument();
      });

      await expectNoA11yViolations(document.body);
    });
  });
});
