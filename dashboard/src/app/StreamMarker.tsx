/**
 * Whether the dashboard is live.
 *
 * `API.md` rules out a polling fallback and asks for this instead: a
 * dashboard that silently displays yesterday's queue is worse than one that
 * admits it is disconnected. So the marker is not decoration — it is the only
 * thing that distinguishes "no new Anfragen" from "no connection", and it
 * says what to do about the second.
 *
 * `aria-live="polite"` rather than `assertive`: losing the stream does not
 * interrupt what a Staff member is doing, and the row they are reading stays
 * correct.
 *
 * It reads from the left, not the right end of the strip, because an open
 * `ApplicationDrawer` lies over that corner and "Nicht verbunden" is the only
 * reason the marker exists (issue #64). A quiet status in the corner was the
 * nicer arrangement and loses to the corner being occupied. `DRAWER_RESERVE`
 * finishes the job: the wording wraps before the drawer's column instead of
 * running under it, since the hint is the half that says what to do.
 */

import { de } from '@/content/de';
import { cx } from '@/utils/cx';

import { DRAWER_RESERVE } from './strip';

type StreamMarkerProps = {
  connected: boolean;
};

export function StreamMarker({ connected }: StreamMarkerProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cx(
        'text-tertiary flex flex-wrap items-center gap-1.5 text-xs',
        DRAWER_RESERVE,
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'size-1.5 rounded-full',
          connected ? 'bg-utility-green-500' : 'bg-utility-red-500',
        )}
      />
      {connected ? (
        de.dashboard.live
      ) : (
        <>
          <span className="font-medium">{de.dashboard.disconnected}</span>
          <span>{de.dashboard.disconnectedHint}</span>
        </>
      )}
    </p>
  );
}
