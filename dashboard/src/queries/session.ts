/**
 * The current Sign-in, and the three things that change it: `GET /me` on boot,
 * the two requests a Staff member makes, and a `401` from anywhere.
 *
 * The Sign-in is an `HttpOnly` cookie, so the dashboard cannot look at it: the
 * question "is someone signed in?" is `GET /me`, asked once on boot. A missing
 * Sign-in answers `401 UNAUTHENTICATED`, which is not a failure the Staff
 * member has to read — it is the sign-in screen. So this is the one query that
 * turns a problem into data; any other failure still reaches `error`, where
 * the boot gate words it.
 *
 * **A `401` after that is a different answer.** It means the Sign-in ran out
 * under someone who was working, and the dashboard owes them the screens they
 * had and the text they typed. `markSignInExpired` is what the `QueryClient`'s
 * cache-level callbacks call for it (`queryClient.ts`) and what the live stream
 * calls when repeated failures turn out to be an expired Sign-in rather than a
 * backend that is down (`useApplicationStream.ts`) — one transition, in one
 * place, whatever noticed it.
 */

import type { QueryClient } from '@tanstack/react-query';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { isUnauthenticated } from '@/api/problem';
import type { Credentials } from '@/api/session';
import { fetchSignedInStaffMember, signIn, signOut } from '@/api/session';
import type { SignIn } from '@/domain/signIn';
import { activeSignIn, expireSignIn, NO_SIGN_IN } from '@/domain/signIn';

import { queryKeys } from './keys';

export const signInQuery = queryOptions({
  queryKey: queryKeys.signIn,
  queryFn: async (): Promise<SignIn> => {
    try {
      return activeSignIn(await fetchSignedInStaffMember());
    } catch (failure) {
      if (isUnauthenticated(failure)) {
        return NO_SIGN_IN;
      }
      throw failure;
    }
  },
  /**
   * A `401` is an answer, not a hiccup, and retrying it would delay the
   * sign-in screen by however long the retries take.
   */
  retry: false,
});

/** The Sign-in the dashboard is running under, as the application sees it. */
export function useCurrentSignIn() {
  return useQuery(signInQuery);
}

/**
 * Turns the Sign-in the cache holds into an expired one — the one write that
 * puts the sign-in cover over the dashboard.
 *
 * It reaches for the cache rather than taking the Staff member as an argument
 * because whoever noticed the `401` does not know who was signed in: a failed
 * `PATCH` knows an Application, and the stream knows a dropped connection.
 * `expireSignIn` decides what the transition is; this only applies it, and
 * does nothing at all before the boot answer has arrived.
 */
export function markSignInExpired(queryClient: QueryClient): void {
  queryClient.setQueryData<SignIn>(queryKeys.signIn, (current) =>
    current === undefined ? current : expireSignIn(current),
  );
}

/**
 * A successful sign-in writes the Staff member straight into the cache rather
 * than invalidating it: the response body *is* `GET /me`'s (`API.md`), so a
 * second request would ask a question that has just been answered.
 *
 * Signing in *out of the cover* is the interesting case, and it splits by who
 * signed in:
 *
 * - **the same Staff member** is resuming, which is what the cover exists for.
 *   The cache is kept — the lists, the filters and the notes draft below it are
 *   the work — and then invalidated, because a read may have failed and a write
 *   may have been refused while the Sign-in was out. Invalidating keeps the
 *   data on screen and asks again behind it, so `DashboardGate` does not go
 *   back to its loading panel and unmount the drawer holding the draft;
 * - **somebody else** is not resuming that work, they are borrowing the
 *   machine. The cache holds Applicants' personal data and an unsent note in
 *   the drawer, so it is cleared for the same reason signing out clears it.
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => signIn(credentials),
    onSuccess: (staffMember) => {
      const previous = queryClient.getQueryData<SignIn>(queryKeys.signIn);
      const wasCovering = previous?.kind === 'expired';
      const resuming =
        wasCovering && previous.staffMember.id === staffMember.id;

      if (wasCovering && !resuming) {
        queryClient.clear();
      }

      queryClient.setQueryData<SignIn>(
        queryKeys.signIn,
        activeSignIn(staffMember),
      );

      if (resuming) {
        void queryClient.invalidateQueries();
      }
    },
  });
}

/**
 * Signing out clears the whole cache, not only the Sign-in entry: the four
 * dashboard queries hold Applicants' personal data, and leaving them in
 * memory would let the next sign-in — possibly another Staff member on a
 * shared machine — see the previous one's list for as long as the refetch
 * takes.
 *
 * The cookie is cleared by the response, so the request is sent even when it
 * fails; a Staff member who pressed "Abmelden" is signed out of the
 * dashboard either way, and the stale cookie is refused by the next request.
 *
 * Clearing while the screens are still mounted re-creates their queries, so a
 * short burst of `401`s follows on the way out. They cannot be mistaken for an
 * expired Sign-in: `expireSignIn` only expires an *active* Sign-in, and this
 * one is already gone by the time they answer.
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => signOut(),
    onSettled: () => {
      queryClient.clear();
    },
  });
}
