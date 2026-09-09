/**
 * What a Staff member reads when a write failed. One notice for the whole
 * dashboard, above the screens, for the reason `API.md` gives about bulk
 * actions: a partial failure says so *once*, not once per request.
 *
 * A read that fails has `DashboardGate`'s panel and a retry button; a write
 * that fails has neither, because the Staff member has already moved on and
 * the change they made is being rolled back underneath them. So this says what
 * went wrong and nothing else — the list behind it has already been refetched,
 * which is the only "retry" that would mean anything here.
 *
 * It is the sign-in screen's rejection block, in the shell: the same border,
 * the same tint and the same `role="alert"`, because it is the same kind of
 * sentence about the same kind of failure.
 *
 * Dismissable rather than self-clearing on a timer: the wording for
 * `CATEGORY_IN_USE` tells the Staff member what to do instead, and a sentence
 * that removes itself while it is being read is worse than one that waits.
 *
 * One code never reaches it: a write refused because the Sign-in expired is
 * already answered by the cover coming up over the whole dashboard
 * (`SignInCover`), and a general "Aktion fehlgeschlagen" underneath it would
 * name a symptom while the real sentence sits on top of it.
 */

import { XClose } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { isUnauthenticated, problemCode } from '@/api/problem';
import { Button } from '@/components/base/buttons/button';
import { de } from '@/content/de';
import { errorMessage } from '@/content/errorMessage';
import type { WriteFailures as WriteFailuresValue } from '@/queries/writeFailures';
import { useWriteFailure, WriteFailuresContext } from '@/queries/writeFailures';

export function WriteFailureNotice() {
  const { failure, dismiss } = useWriteFailure();

  if (failure === null) {
    return null;
  }

  return (
    <div className="border-utility-red-200 bg-bg-error-primary flex items-start gap-3 rounded-lg border px-3.5 py-3">
      <p role="alert" className="text-text-error-primary flex-1 text-sm">
        {errorMessage(problemCode(failure))}
      </p>
      <Button
        size="sm"
        color="tertiary"
        iconLeading={XClose}
        aria-label={de.dashboard.dismissFailure}
        onClick={dismiss}
      />
    </div>
  );
}

/**
 * Remembers the last failed write, for the notice above and for every mutation
 * below. It wraps the dashboard rather than the whole application: the sign-in
 * screen words its own rejection next to the form.
 *
 * One failure, not a list. Five discards that all failed are one thing that
 * went wrong, and five identical sentences would say it five times.
 */
export function WriteFailures({ children }: { children: ReactNode }) {
  const [failure, setFailure] = useState<unknown>(null);

  const report = useCallback((raised: unknown) => {
    if (isUnauthenticated(raised)) {
      return;
    }

    setFailure(raised);
  }, []);

  const dismiss = useCallback(() => {
    setFailure(null);
  }, []);

  const value = useMemo<WriteFailuresValue>(
    () => ({ failure, report, dismiss }),
    [failure, report, dismiss],
  );

  return (
    <WriteFailuresContext.Provider value={value}>
      {children}
    </WriteFailuresContext.Provider>
  );
}
