import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { de } from '@/content/de';
import { mockStaffMember } from '@/data/mockApplications';
import { renderApp, renderSignedIn } from '@/test/renderApp';
import type { StubbedApi } from '@/test/stubApi';
import { REFERENCE_DATE, stubApi } from '@/test/stubApi';

import { DRAWER_RESERVE } from './strip';

/**
 * The whole application against the stubbed backend: `fetch` answers from the
 * fixtures and the live stream stays inert unless a test drives it
 * (`src/test/stubApi.ts`).
 */
describe('App', () => {
  let api: StubbedApi;

  beforeEach(() => {
    api = stubApi();
  });

  afterEach(() => {
    window.location.hash = '';
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** Which requests the application actually made, by method and path. */
  function calls(method: string, path: string) {
    return vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url, init]) =>
          typeof url === 'string' &&
          url.includes(path) &&
          (init?.method ?? 'GET') === method,
      );
  }

  it('opens the sign-in screen when GET /me finds no Sign-in', async () => {
    api.signedIn = false;

    renderApp();

    expect(
      await screen.findByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: de.navigation.label }),
    ).not.toBeInTheDocument();
  });

  it('opens the dashboard when GET /me answers with a Staff member', async () => {
    await renderSignedIn();

    expect(screen.getByText(mockStaffMember.email)).toBeInTheDocument();
    expect(screen.getByText('Mara Weber')).toBeInTheDocument();
  });

  it('signs out from the account menu, back to the sign-in screen', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));
    await user.click(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    );

    // `DELETE /session` clears the cookie, so `GET /me` now answers `401`.
    expect(
      await screen.findByRole('heading', { name: de.auth.title }),
    ).toBeInTheDocument();
    expect(api.signedIn).toBe(false);
  });

  it('opens on the Applications screen', async () => {
    await renderSignedIn();

    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(de.overview.welcome(mockStaffMember.name)),
    ).not.toBeInTheDocument();
  });

  it('shows the four screens in the sidebar, Anfragen current', async () => {
    await renderSignedIn();

    const sidebar = screen.getByRole('navigation', {
      name: de.navigation.label,
    });

    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      de.navigation.overview,
      de.navigation.applications,
      de.navigation.categories,
      // The fourth screen is last, in the sidebar's footer slot rather than
      // among the three the work happens on (`A16`).
      de.navigation.discarded,
    ]);

    expect(
      within(sidebar).getByRole('link', { name: de.navigation.applications }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('opens the account menu from the profile card', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(screen.getByRole('button', { name: de.account.menu }));

    expect(
      screen.getByRole('menuitem', { name: de.account.signOut }),
    ).toBeInTheDocument();
  });

  it('collapses the desktop sidebar to its icon navigation', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(
      screen.getByRole('button', { name: de.navigation.collapse }),
    );

    const toggle = screen.getByRole('button', { name: de.navigation.expand });

    expect(toggle).toBeInTheDocument();
    expect(toggle.closest('nav')).toBeInTheDocument();
    expect(toggle).toHaveClass('peer/toggle');
    expect(toggle).toHaveClass('lg:left-1/2', '-translate-x-1/2');
    expect(
      screen.getByRole('navigation', { name: de.navigation.label }),
    ).toHaveClass('lg:transition-[width]', 'duration-200');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }),
    ).not.toHaveClass('lg:justify-center');
    expect(
      screen.getByRole('link', { name: de.navigation.applications }).lastChild,
    ).toHaveClass('lg:max-w-0', 'lg:[clip-path:inset(0_100%_0_0)]');
    expect(toggle).not.toHaveClass('bg-primary');
    expect(toggle).toHaveClass('hover:bg-primary_hover');
    expect(toggle.querySelector('svg')).toHaveClass(
      'lg:group-hover:opacity-100',
    );
    const compactWordmarks = Array.from(
      document.querySelectorAll('img[src="/Rectangle.png"]'),
    );
    const sidebarCompactWordmark = compactWordmarks.find((wordmark) =>
      wordmark.classList.contains('lg:opacity-100'),
    );

    expect(sidebarCompactWordmark).toHaveClass('opacity-0', 'lg:opacity-100');
    expect(
      sidebarCompactWordmark?.parentElement?.parentElement,
    ).not.toHaveClass('lg:opacity-0');
    expect(sidebarCompactWordmark?.parentElement?.parentElement).toHaveClass(
      'lg:left-1/2',
      'lg:-translate-x-1/2',
      'lg:peer-hover/toggle:opacity-0',
    );
    expect(screen.getByRole('button', { name: de.account.menu })).toHaveClass(
      'rounded-full',
    );
  });

  it('switches the active sidebar link and shows the welcome headline', async () => {
    const user = userEvent.setup();

    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    expect(
      screen.getByRole('link', { name: de.navigation.overview }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByText(de.overview.welcome(mockStaffMember.name)),
    ).toBeInTheDocument();
  });

  it('carries a Category renamed on Kategorien over to Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.categories }),
    );

    await user.click(
      screen.getByRole('button', {
        name: de.categories.editOne('Rechtliche Unterstützung'),
      }),
    );

    const field = screen.getByRole('textbox', { name: /^Name/ });
    await user.clear(field);
    await user.type(field, 'Rechtsberatung');
    await user.click(
      screen.getByRole('button', { name: de.categories.dialog.save }),
    );

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await waitFor(() => {
      expect(screen.getAllByText('Rechtsberatung').length).toBeGreaterThan(0);
    });
  });

  it('discards an Application to the fourth screen and restores it', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: de.discarded.restoreOne('Mara Weber'),
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.getByText('Mara Weber')).toBeInTheDocument();
  });

  it('erases a discarded Application, with no way back to Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('button', {
        name: de.applications.discardOne('Mara Weber'),
      }),
    );
    await user.click(
      screen.getByRole('link', { name: de.navigation.discarded }),
    );
    await user.click(
      screen.getByRole('button', {
        name: de.discarded.eraseOne('Mara Weber'),
      }),
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: de.discarded.erase,
      }),
    );

    expect(screen.getByText(de.discarded.empty)).toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    expect(screen.queryByText('Mara Weber')).not.toBeInTheDocument();
  });

  it('shares an edit on an Application between Übersicht and Anfragen', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.click(
      screen.getByRole('link', { name: de.navigation.overview }),
    );

    // "Jonas Krüger" is one of the five oldest open Applications, unlike
    // "Mara Weber" (arrived today), which the panel's five-row cap excludes.
    const overviewPanel = screen.getByRole('region', {
      name: de.overview.openApplications.title,
    });
    await waitFor(() =>
      expect(
        within(overviewPanel).getByText('Jonas Krüger'),
      ).toBeInTheDocument(),
    );
    await user.click(within(overviewPanel).getByText('Jonas Krüger'));
    await user.selectOptions(screen.getByLabelText('Status'), 'In Prüfung');
    await user.click(screen.getByRole('button', { name: de.detail.close }));

    await user.click(
      screen.getByRole('link', { name: de.navigation.applications }),
    );

    await user.click(screen.getByRole('button', { name: de.filters.filter }));

    await user.selectOptions(
      screen.getByLabelText(de.filters.status),
      screen.getByRole('option', { name: de.statuses.IN_REVIEW }),
    );

    await waitFor(() =>
      expect(screen.getByText('Jonas Krüger')).toBeInTheDocument(),
    );
  });
  /**
   * The writes, against the stubbed backend that really applies them
   * (`src/test/stubApi.ts`). What is worth a test here rather than in a
   * container is the pair of facts a screen cannot show on its own: that a
   * request was sent at all, and what is left on screen when it fails.
   */
  describe('the writes', () => {
    it('sends a Status change as a PATCH of that one field', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));
      await user.selectOptions(
        screen.getByLabelText(de.detail.status),
        de.statuses.IN_REVIEW,
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
      });
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"status":"IN_REVIEW"}',
      );
    });

    /**
     * The one distinction the endpoint turns on: an absent `ownerId` leaves
     * the Owner alone, an explicit `null` clears it (`API.md`). The selector's
     * empty option is the only thing in the dashboard that means the second.
     */
    it('clears an Owner with an explicit null', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      const owned = api.applications.find(
        (application) => application.ownerId !== null,
      );
      expect(owned).toBeDefined();

      await user.click(screen.getByText(owned!.name));
      await user.click(screen.getByRole('button', { name: de.detail.owner }));
      await user.click(
        screen.getByRole('option', { name: de.application.unassigned }),
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
      });
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"ownerId":null}',
      );
    });

    /** A bulk action is N single requests; there is no bulk endpoint. */
    it('discards a checked selection as one request per Application', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      const rows = screen.getAllByRole('checkbox').slice(1, 3);
      for (const row of rows) {
        await user.click(row);
      }
      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardSelected(2),
        }),
      );
      await user.click(
        within(
          screen.getByRole('alertdialog', {
            name: de.applications.confirmDiscardSelected(2),
          }),
        ).getByRole('button', { name: de.applications.discard }),
      );

      await waitFor(() => {
        expect(calls('PATCH', '/staff/applications/')).toHaveLength(2);
      });
      expect(
        calls('PATCH', '/staff/applications/').map(([, init]) => init?.body),
      ).toEqual(['{"discarded":true}', '{"discarded":true}']);
    });

    /**
     * The optimistic half is what a Staff member sees first, so the failure
     * has to put the row back — and say so once, above the screens, since
     * there is no panel to retry from the way a failed read has one.
     */
    it('rolls a failed discard back and words it once', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      api.writeFailure = { status: 500, code: 'INTERNAL_ERROR' };

      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardOne('Mara Weber'),
        }),
      );

      expect(await screen.findByRole('alert')).toHaveTextContent(
        de.errors.codes.INTERNAL_ERROR,
      );
      await waitFor(() => {
        expect(screen.getByText('Mara Weber')).toBeInTheDocument();
      });
      expect(screen.getAllByRole('alert')).toHaveLength(1);
    });

    it('sends the internal note once typing pauses, and keeps it when it fails', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      api.writeFailure = { status: 500, code: 'INTERNAL_ERROR' };

      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      await waitFor(
        () => {
          expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
        },
        { timeout: 3000 },
      );
      expect(calls('PATCH', '/staff/applications/')[0]?.[1]?.body).toBe(
        '{"internalNotes":"Rückruf"}',
      );
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
    });

    it('erases through the permanently path, after the server has', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(
        screen.getByRole('button', {
          name: de.applications.discardOne('Mara Weber'),
        }),
      );
      await user.click(
        screen.getByRole('link', { name: de.navigation.discarded }),
      );
      await user.click(
        screen.getByRole('button', {
          name: de.discarded.eraseOne('Mara Weber'),
        }),
      );
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: de.discarded.erase,
        }),
      );

      await waitFor(() => {
        expect(calls('DELETE', '/permanently')).toHaveLength(1);
      });
      expect(api.applications.some((row) => row.name === 'Mara Weber')).toBe(
        false,
      );
    });

    /**
     * Kategorien awaits the server for every write, because the id and the
     * name's uniqueness are the server's (`API.md`) — so the new row on screen
     * is the refetched one, not an optimistic guess.
     */
    it('creates a Category the server minted the id for', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(
        screen.getByRole('link', { name: de.navigation.categories }),
      );
      await user.click(screen.getByRole('button', { name: de.categories.add }));
      await user.type(
        screen.getByRole('textbox', { name: /^Name/ }),
        'Fundraising',
      );
      await user.click(
        screen.getByRole('button', { name: de.categories.dialog.create }),
      );

      await waitFor(() => {
        expect(calls('POST', '/staff/categories')).toHaveLength(1);
      });
      expect(await screen.findByText('Fundraising')).toBeInTheDocument();
      expect(
        api.categories.find((category) => category.name === 'Fundraising')?.id,
      ).toBeDefined();
    });

    /** The whole order, as ids — not a direction (`API.md`). */
    it('sends the whole order when a Category moves', async () => {
      const user = userEvent.setup();
      await renderSignedIn();
      const [first, second] = api.categories;
      expect(second).toBeDefined();

      await user.click(
        screen.getByRole('link', { name: de.navigation.categories }),
      );
      await user.click(
        screen.getByRole('button', {
          name: de.categories.moveUpOne(second!.name),
        }),
      );

      await waitFor(() => {
        expect(calls('PUT', '/staff/categories/order')).toHaveLength(1);
      });
      expect(calls('PUT', '/staff/categories/order')[0]?.[1]?.body).toContain(
        `["${second!.id}","${first!.id}"`,
      );
    });
  });

  /**
   * An expired Sign-in, which is the one failure the dashboard answers by
   * covering itself rather than by wording something (`API.md`, "When a
   * Sign-in expires"). What makes these tests worth running at the whole
   * application is exactly what a component test cannot show: that nothing
   * was unmounted, so the drawer, the filters and the typed note are still
   * there when the Staff member signs in again.
   */
  describe('an expired Sign-in', () => {
    /**
     * `base/input` keeps the required marker in the DOM, so the accessible
     * label reads "Passwort *" under jsdom; `selector` also keeps the loose
     * match off the password field's own visibility toggle.
     */
    function coverField(label: string): HTMLElement {
      return screen.getByLabelText(label, {
        exact: false,
        selector: 'input',
      });
    }

    /** Opens Mara Weber's drawer and types a note the Sign-in then refuses. */
    async function typeANoteAndLetTheSignInExpire(
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> {
      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      api.signedIn = false;

      await waitFor(
        () => {
          expect(calls('PATCH', '/staff/applications/')).toHaveLength(1);
        },
        { timeout: 3000 },
      );
    }

    it('covers the dashboard and keeps the work when a write answers 401', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();

      /** Everything below the cover is still mounted, note and all. */
      const shell = screen.getByRole('navigation', {
        name: de.navigation.label,
      });
      expect(shell).toBeInTheDocument();
      expect(shell.closest('[inert]')).not.toBeNull();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );

      /** The cover is the sentence; the write notice does not repeat it. */
      expect(screen.queryByText(de.errors.general)).not.toBeInTheDocument();
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });

    it('drops the cover and leaves the Staff member where they were', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);
      await screen.findByRole('heading', { name: de.auth.expiredTitle });

      /** The address is filled in already: only the password is re-typed. */
      expect(coverField(de.auth.emailLabel)).toHaveValue(mockStaffMember.email);
      await user.type(coverField(de.auth.passwordLabel), 'geheim');
      await user.click(screen.getByRole('button', { name: de.auth.submit }));

      await waitFor(() => {
        expect(
          screen.queryByRole('heading', { name: de.auth.expiredTitle }),
        ).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      expect(
        screen.getByRole('navigation', { name: de.navigation.label }),
      ).not.toHaveAttribute('inert');
    });

    /**
     * The other half of the same rule. Somebody else at the same machine is
     * not resuming that work — the cache holds Applicants' personal data and
     * an unsent note in the drawer, so it goes, exactly as it goes on
     * "Abmelden".
     */
    it('drops the work when somebody else signs in at the cover', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndLetTheSignInExpire(user);
      await screen.findByRole('heading', { name: de.auth.expiredTitle });

      api.staffMember = {
        id: 'staff-other',
        name: 'Rosalie Bergmann',
        email: 'rosalie.bergmann@ichbinhier.online',
      };

      await user.clear(coverField(de.auth.emailLabel));
      await user.type(coverField(de.auth.emailLabel), api.staffMember.email);
      await user.type(coverField(de.auth.passwordLabel), 'geheim');
      await user.click(screen.getByRole('button', { name: de.auth.submit }));

      expect(
        await screen.findByText(api.staffMember.email),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText(de.detail.internalNotes),
      ).not.toBeInTheDocument();
    });

    /**
     * The stream's half. An `EventSource` reports `error` and nothing else, so
     * repeated failures are a reason to ask `GET /me` rather than a verdict:
     * only a `401` there puts the cover up.
     */
    it('asks whether the Sign-in is still there after repeated stream failures', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      api.signedIn = false;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 1);
      expect(api.stream()?.closed).toBe(true);
    });

    /**
     * The other failure. A response — nginx's `502` while the backend
     * restarts, or the `401` once the Sign-in is gone — closes the source for
     * good, so there is no run of retries to wait out: the question is asked
     * on the first one.
     */
    it('asks at once when a response closed the stream for good', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      api.signedIn = false;

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 1);
    });

    it('keeps checking a closed stream until it can identify an expired Sign-in', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      /** nginx can answer before the restarted backend can answer `GET /me`. */
      api.signInCheckFailure = { status: 502, code: 'UPSTREAM_UNAVAILABLE' };

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });
      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();

      api.signInCheckFailure = null;
      api.signedIn = false;

      expect(calls('GET', '/me')).toHaveLength(asked + 1);
      expect(
        await screen.findByRole(
          'heading',
          { name: de.auth.expiredTitle },
          { timeout: 6_000 },
        ),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 2);
    }, 8_000);

    it('reopens the stream when the later Sign-in check succeeds', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;
      const dropped = api.stream();

      api.signInCheckFailure = { status: 502, code: 'UPSTREAM_UNAVAILABLE' };

      act(() => {
        dropped?.fireErrorAndClose();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });

      api.signInCheckFailure = null;

      await waitFor(
        () => {
          expect(api.stream()).not.toBe(dropped);
        },
        { timeout: 6_000 },
      );

      expect(calls('GET', '/me')).toHaveLength(asked + 2);
      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();
    }, 8_000);

    /**
     * And when the Sign-in holds, the hook opens a stream itself. The browser
     * will not: a closed `EventSource` stays closed, so without this a single
     * `502` during a backend restart would leave the dashboard behind a red
     * marker with a stale list for the rest of the day.
     */
    it('opens a fresh stream after the browser has closed one', async () => {
      await renderSignedIn();
      const dropped = api.stream();
      expect(dropped).not.toBeNull();

      vi.useFakeTimers();

      try {
        await act(async () => {
          dropped?.fireErrorAndClose();
          await Promise.resolve();
        });

        await act(async () => {
          await vi.advanceTimersByTimeAsync(5_000);
        });

        expect(api.stream()).not.toBe(dropped);
        expect(
          screen.queryByRole('heading', { name: de.auth.expiredTitle }),
        ).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves the dashboard alone while the Sign-in holds, and asks again', async () => {
      await renderSignedIn();
      const asked = calls('GET', '/me').length;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      await waitFor(() => {
        expect(calls('GET', '/me')).toHaveLength(asked + 1);
      });

      expect(
        screen.queryByRole('heading', { name: de.auth.expiredTitle }),
      ).not.toBeInTheDocument();

      /**
       * And it keeps asking while the failures keep coming: the answer that
       * matters may arrive later than the first question, since a backend
       * restart takes the Sign-ins with it (`A17`) and the first question is
       * asked while the backend is still down.
       */
      api.signedIn = false;

      act(() => {
        api.stream()?.fireError();
        api.stream()?.fireError();
        api.stream()?.fireError();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(calls('GET', '/me')).toHaveLength(asked + 2);
    });
  });

  /**
   * A read that failed *after* the list had arrived — nginx's `502` while the
   * backend restarts. Issue #58 decided that this is not the gate's panel, and
   * what makes it worth running at the whole application is what a component
   * test cannot show: the drawer and the note typed into it are still there,
   * because the notice sits above the screens rather than in place of them.
   */
  describe('a refetch that failed', () => {
    /** Opens Mara Weber's drawer, types a note, then takes the backend away. */
    async function typeANoteAndRestartTheBackend(
      user: ReturnType<typeof userEvent.setup>,
    ): Promise<void> {
      await user.click(screen.getByText('Mara Weber'));
      await user.type(
        screen.getByLabelText(de.detail.internalNotes),
        'Rückruf',
      );

      api.readFailure = { status: 502, code: 'BAD_GATEWAY' };

      /** Every `open` refetches, which is where the restart is noticed. */
      act(() => {
        api.stream()?.fireOpen();
      });
    }

    it('words the stale list once and leaves the work standing', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);

      expect(
        await screen.findByText(de.dashboard.updateFailed),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      /** Two of them: the row is still in the list, and the drawer is open. */
      expect(screen.getAllByText('Mara Weber')).toHaveLength(2);

      /** The panel's wording belongs to a dashboard with nothing to show. */
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });

    /** The retry the panel has, over exactly the queries that failed. */
    it('asks again from the notice', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);
      await screen.findByText(de.dashboard.updateFailed);

      api.readFailure = null;
      const asked = calls('GET', '/staff/applications').length;

      await user.click(
        screen.getByRole('button', { name: de.dashboard.retry }),
      );

      await waitFor(() => {
        expect(
          screen.queryByText(de.dashboard.updateFailed),
        ).not.toBeInTheDocument();
      });
      expect(calls('GET', '/staff/applications').length).toBeGreaterThan(asked);
    });

    /**
     * The double failure issue #58 opened with, from the other side: the
     * `502` used to take the drawer with it and the `401` a moment later
     * covered whatever was left. Now the restart is one dismissable sentence
     * and the cover comes up over the same work.
     */
    it('lets the 401 behind it cover the same work', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await typeANoteAndRestartTheBackend(user);
      await screen.findByText(de.dashboard.updateFailed);

      /** The backend is back, and the Sign-in did not survive it (`A17`). */
      api.readFailure = null;
      api.signedIn = false;

      act(() => {
        api.stream()?.fireErrorAndClose();
      });

      expect(
        await screen.findByRole('heading', { name: de.auth.expiredTitle }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(de.detail.internalNotes)).toHaveValue(
        'Rückruf',
      );
      expect(
        screen.queryByText(de.dashboard.loadFailed),
      ).not.toBeInTheDocument();
    });
  });

  /**
   * The corner an open `ApplicationDrawer` lies over (issue #64). It is an
   * `aside` with no scrim, so it blocks nothing and must not eat a click on a
   * control it happens to cover — which the strip answers by keeping its right
   * end clear rather than by learning that a drawer is open.
   *
   * jsdom lays nothing out, so these assert the mechanism and not two boxes
   * that would both measure zero: nothing in the strip is placed at the right
   * end, so the end the drawer covers holds nothing to reach. The geometry is
   * a browser pass, at 1024px and 1280px with a drawer open.
   */
  describe('the strip under an open drawer', () => {
    it("leaves the notice's retry clear of the drawer", async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      await user.click(screen.getByText('Mara Weber'));
      api.readFailure = { status: 502, code: 'BAD_GATEWAY' };
      act(() => {
        api.stream()?.fireOpen();
      });

      const sentence = await screen.findByText(de.dashboard.updateFailed);
      /** The drawer really is over the strip while that is read. */
      expect(
        screen.getByLabelText(de.detail.internalNotes),
      ).toBeInTheDocument();

      const retry = screen.getByRole('button', { name: de.dashboard.retry });
      const dismiss = screen.getByRole('button', {
        name: de.dashboard.dismissFailure,
      });

      /**
       * A second row beneath the sentence rather than two more items beside
       * it, so the buttons' position stops depending on how long the sentence
       * runs.
       */
      const actions = retry.parentElement;
      expect(actions).toBe(dismiss.parentElement);
      expect(actions).not.toContainElement(sentence);
      expect(sentence.nextElementSibling).toBe(actions);
      expect(actions).not.toHaveClass('justify-end');
      expect(actions).not.toHaveClass('ml-auto');

      /**
       * And the two of them stack rather than overflow when what is left of
       * the strip will not hold both — 1024px leaves 189px against the 322px
       * they want side by side.
       */
      expect(actions).toHaveClass('flex-wrap');

      /**
       * The contents keep out of the drawer's column, the sentence included:
       * left alignment alone let it keep its natural width and run under the
       * drawer. The border does not — the box spans `main` on purpose.
       */
      const contents = actions?.parentElement;
      expect(contents).toHaveClass('flex-col');
      expect(contents).toHaveClass('items-start');
      expect(contents?.className).toContain(DRAWER_RESERVE);
      expect(contents?.parentElement?.className).not.toContain(DRAWER_RESERVE);
      expect(contents?.parentElement).toHaveClass('border');

      /** The corner `XClose` is gone, so the label is read and not only announced. */
      expect(dismiss).toHaveTextContent(de.dashboard.dismissFailure);
      expect(dismiss.querySelector('svg')).toBeNull();
    });

    /**
     * The rule covers what has to be *read* as much as what can be clicked.
     * "Nicht verbunden" is the only reason the marker exists, so the corner is
     * the one place it may not sit.
     */
    it('reads the disconnected wording clear of the drawer', async () => {
      const user = userEvent.setup();
      await renderSignedIn();

      /** Disconnected is where the marker starts, and the drawer goes over it. */
      await user.click(screen.getByText('Mara Weber'));

      const marker = screen
        .getByText(de.dashboard.disconnected)
        .closest('[role="status"]');

      expect(
        screen.getByLabelText(de.detail.internalNotes),
      ).toBeInTheDocument();
      expect(marker).not.toBeNull();
      expect(marker).not.toHaveClass('justify-end');
      /** The hint is the half that says what to do, so it wraps rather than hides. */
      expect(marker).toHaveClass('flex-wrap');
      expect(marker?.className).toContain(DRAWER_RESERVE);
    });
  });

  /**
   * The three stream behaviours the contract turns on: an event applies
   * without a follow-up request, every `open` refetches because the server
   * keeps no replay buffer, and the marker says whether any of that is
   * happening (`API.md`, "The live stream").
   */
  describe('the live stream', () => {
    function submitted(name: string) {
      const at = REFERENCE_DATE.toISOString();

      return {
        id: 'application-live',
        categoryId: 'social-media',
        name,
        email: 'live@example.org',
        weeklyTime: 'HOURS_1_2' as const,
        about: null,
        status: 'NEW' as const,
        ownerId: null,
        internalNotes: '',
        discardedAt: null,
        consentAt: at,
        consentTextVersion: '2026-09',
        submittedAt: at,
      };
    }

    it('shows an Application submitted while the dashboard is open', async () => {
      await renderSignedIn();

      expect(screen.queryByText('Ida Lindqvist')).not.toBeInTheDocument();

      const requests = vi.mocked(fetch).mock.calls.length;
      act(() => {
        api.stream()?.emit('application.created', submitted('Ida Lindqvist'));
      });

      expect(await screen.findByText('Ida Lindqvist')).toBeInTheDocument();
      // Applied from the event itself: the row cost no request.
      expect(vi.mocked(fetch).mock.calls).toHaveLength(requests);
    });

    it('drops an erased Application on application.deleted', async () => {
      await renderSignedIn();

      const [first] = api.applications;
      expect(first).toBeDefined();

      act(() => {
        api.stream()?.emit('application.deleted', first!);
      });

      await waitFor(() => {
        expect(screen.queryByText(first!.name)).not.toBeInTheDocument();
      });
    });

    it('refetches the list on every open, including a reconnect', async () => {
      await renderSignedIn();

      api.applications = [submitted('Ida Lindqvist'), ...api.applications];

      act(() => {
        api.stream()?.fireOpen();
      });

      expect(await screen.findByText('Ida Lindqvist')).toBeInTheDocument();
    });

    it('says whether the dashboard is live', async () => {
      await renderSignedIn();

      expect(screen.getByText(de.dashboard.disconnected)).toBeInTheDocument();

      act(() => {
        api.stream()?.fireOpen();
      });

      expect(await screen.findByText(de.dashboard.live)).toBeInTheDocument();
    });
  });
});
