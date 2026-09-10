/**
 * The live stream, and the only place an `EventSource` exists (`API.md`, "The
 * live stream"). Called once, from `AppShell`, so a screen change does not
 * drop and reopen the connection.
 *
 * Three behaviours are the whole point of the hook:
 *
 * **Every `open` refetches.** The server honours no `Last-Event-ID` and keeps
 * no replay buffer, so what makes a reconnect correct is refetching the list
 * and the state changes rather than replaying missed events. That includes
 * the first `open`, even though the boot fetch is usually still in flight:
 * an Application created between the server's snapshot and the connection
 * going up is exactly the row a "cheaper" first-open shortcut would lose.
 *
 * **The connection marker does not flicker.** A browser fires `error` on
 * every reconnect attempt, and `EventSource` reconnects on its own within a
 * second or two. Reporting each one would blink "Nicht verbunden" over a
 * connection that never really went away, so the marker waits out a grace
 * period (`A18`) and only then admits the dashboard is not live.
 *
 * **A failure is asked about, never guessed at.** An `EventSource` cannot read
 * a status code — all it reports is `error` — so the stream asks `GET /me`,
 * and only a `401` there puts the sign-in cover up (`markSignInExpired`).
 * Guessing instead would show the sign-in screen to a Staff member whose
 * Sign-in is fine and whose backend is merely down, asking them for a password
 * no request can check.
 *
 * **Two failures wear the same name and behave nothing alike**, which
 * `readyState` is the only way to tell apart:
 *
 * - a *dropped connection* leaves the source `CONNECTING`, and the browser
 *   repairs it by itself. That is the flicker case: the marker waits, and the
 *   question is asked only after a run of them;
 * - a *response* — nginx's `502` while the backend restarts, or the `401` the
 *   backend answers once the Sign-in is gone — leaves it `CLOSED`. The browser
 *   is done: it will not try again, ever. So the question is asked at once, and
 *   if the Sign-in holds this hook opens a fresh stream itself. Without that,
 *   one `502` during a restart would leave the dashboard behind a red marker
 *   for the rest of the day, with a stale list and no way back but a reload —
 *   which is also why `API.md`'s "`EventSource` reconnects on its own" is only
 *   half true and this file has to make up the other half.
 *
 * A backend restart is both at once, and the reason the question is repeated
 * rather than asked once: Sign-ins live in the backend's memory (`A17`), so a
 * restart drops the stream *and* ends every Sign-in — and the first question
 * lands while the backend is still down, where a network failure says nothing
 * about the Sign-in. It is a slow heartbeat, not a poll: it runs only while the
 * stream is down, and stops the moment the stream is back or the cover is up.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { isUnauthenticated } from '@/api/problem';
import { fetchSignedInStaffMember } from '@/api/session';
import { STAFF_API } from '@/api/transport';
import type { Application } from '@/domain/application';

import {
  APPLICATION_EVENT_TYPES,
  applyApplicationEvent,
  parseApplicationEvent,
} from './applicationEvents';
import { queryKeys } from './keys';
import { markSignInExpired } from './session';

/** How long a dropped connection may take to come back before it is reported. */
const DISCONNECTED_AFTER_MS = 3_000;

/**
 * How many *dropped* connections make the stream worth a question rather than
 * another reconnect (`A18`). One `error` follows every drop, including the ones
 * `EventSource` repairs by itself; three without an `open` in between mean it
 * is not coming back on its own. A response that closed the source is not
 * counted at all — there is nothing left to wait for.
 */
const FAILURES_BEFORE_ASKING = 3;

/**
 * How long to wait before opening a stream the browser has closed for good
 * (`A18`). Long enough that a backend coming back up is not raced, short
 * enough that the dashboard is live again while the Staff member is still
 * looking at it — and it is the interval of the `GET /me` heartbeat too, since
 * each attempt asks once.
 */
const REOPEN_AFTER_MS = 5_000;

export type StreamConnection = {
  /** Whether the dashboard is currently receiving changes as they happen. */
  connected: boolean;
};

export type ApplicationStreamOptions = {
  /**
   * `false` while the sign-in cover is up: there is no Sign-in to authenticate
   * the stream with, so holding a connection open would only collect `401`s.
   * Signing in again opens a fresh one, and every `open` refetches — which is
   * also how the dashboard catches up on what it missed while covered.
   */
  enabled?: boolean;
};

export function useApplicationStream({
  enabled = true,
}: ApplicationStreamOptions = {}): StreamConnection {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  /**
   * Bumped to open a fresh stream after the browser has closed one for good.
   * The connection is the effect's, so re-running the effect is the only way
   * to replace it — and counting the attempts keeps that explicit rather than
   * hiding a second `EventSource` inside a callback.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const source = new EventSource(`${STAFF_API}/events`);
    let grace: ReturnType<typeof setTimeout> | undefined;
    let reopen: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    function cancelGrace(): void {
      if (grace !== undefined) {
        clearTimeout(grace);
        grace = undefined;
      }
    }

    /**
     * Not a query: the answer is not the boot question being asked again but a
     * check on the connection that just failed, and routing it through the
     * Sign-in query would overwrite the cover with `GET /me`'s own verdict.
     * Anything other than a `401` — a network failure most of all — says
     * nothing about the Sign-in, and the marker already says the stream is
     * down.
     */
    async function askWhetherSignedIn(): Promise<boolean> {
      try {
        await fetchSignedInStaffMember();
        return false;
      } catch (failure) {
        if (isUnauthenticated(failure)) {
          markSignInExpired(queryClient);
          return true;
        }

        return false;
      }
    }

    source.onopen = () => {
      cancelGrace();
      failures = 0;
      setConnected(true);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stateChanges,
      });
    };

    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) {
        void askWhetherSignedIn();

        reopen ??= setTimeout(() => {
          void askWhetherSignedIn().then(
            (expired) => {
              if (!expired) {
                setAttempt((current) => current + 1);
              }
            },
            () => {
              setAttempt((current) => current + 1);
            },
          );
        }, REOPEN_AFTER_MS);
      } else {
        failures += 1;

        if (failures >= FAILURES_BEFORE_ASKING) {
          failures = 0;
          void askWhetherSignedIn();
        }
      }

      if (grace === undefined) {
        grace = setTimeout(() => {
          grace = undefined;
          setConnected(false);
        }, DISCONNECTED_AFTER_MS);
      }
    };

    /**
     * An event applies to the cache only when the cache holds a list: before
     * the boot fetch lands there is nothing to apply it to, and writing one
     * Application in as the whole list would show a dashboard with a single
     * row until the fetch replaced it.
     */
    const listeners = APPLICATION_EVENT_TYPES.map((type) => {
      const listener = (message: Event) => {
        const event = parseApplicationEvent(
          type,
          (message as MessageEvent<string>).data,
        );

        if (event === null) {
          return;
        }

        queryClient.setQueryData<Application[]>(
          queryKeys.applications,
          (current) =>
            current === undefined
              ? current
              : applyApplicationEvent(current, event),
        );
      };

      source.addEventListener(type, listener);
      return { type, listener };
    });

    return () => {
      cancelGrace();
      clearTimeout(reopen);
      for (const { type, listener } of listeners) {
        source.removeEventListener(type, listener);
      }
      source.close();
      /**
       * The connection this hook reported is gone with the source, so the
       * marker may not keep claiming the dashboard is live — least of all
       * while the sign-in cover is up, which is the one thing that closes the
       * stream without unmounting the shell that renders the marker.
       */
      setConnected(false);
    };
  }, [queryClient, enabled, attempt]);

  return { connected };
}
