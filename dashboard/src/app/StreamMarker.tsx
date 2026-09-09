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
 */

import { de } from '@/content/de';
import { cx } from '@/utils/cx';

type StreamMarkerProps = {
  connected: boolean;
};

export function StreamMarker({ connected }: StreamMarkerProps) {
  return (
    <p
      role="status"
      aria-live="polite"
      className="text-tertiary flex items-center justify-end gap-1.5 text-xs"
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
