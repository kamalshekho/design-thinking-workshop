/**
 * The live stream, and the only place an `EventSource` exists (`API.md`, "The
 * live stream"). Called once, from `AppShell`, so a screen change does not
 * drop and reopen the connection.
 *
 * Two behaviours are the whole point of the hook:
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
 * period and only then admits the dashboard is not live.
 */

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { STAFF_API } from '@/api/transport';
import type { Application } from '@/domain/application';

import {
  APPLICATION_EVENT_TYPES,
  applyApplicationEvent,
  parseApplicationEvent,
} from './applicationEvents';
import { queryKeys } from './keys';

/** How long a dropped connection may take to come back before it is reported. */
const DISCONNECTED_AFTER_MS = 3_000;

export type StreamConnection = {
  /** Whether the dashboard is currently receiving changes as they happen. */
  connected: boolean;
};

export function useApplicationStream(): StreamConnection {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(`${STAFF_API}/events`);
    let grace: ReturnType<typeof setTimeout> | undefined;

    function cancelGrace(): void {
      if (grace !== undefined) {
        clearTimeout(grace);
        grace = undefined;
      }
    }

    source.onopen = () => {
      cancelGrace();
      setConnected(true);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.applications,
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.stateChanges,
      });
    };

    source.onerror = () => {
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
      for (const { type, listener } of listeners) {
        source.removeEventListener(type, listener);
      }
      source.close();
    };
  }, [queryClient]);

  return { connected };
}
