/**
 * Whether a Staff member is signed in, and the two requests that change the
 * answer.
 *
 * The Sign-in is an `HttpOnly` cookie, so the dashboard cannot look at it:
 * the question "is someone signed in?" is `GET /me`, asked once on boot. A
 * missing or expired Sign-in answers `401 UNAUTHENTICATED`, which is not a
 * failure the Staff member has to read — it is the sign-in screen. So this is
 * the one query that turns a problem into data: `null` means nobody is signed
 * in, and any other failure still reaches `error`, where the boot gate words
 * it.
 */

import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { isUnauthenticated } from '@/api/problem';
import type { Credentials } from '@/api/session';
import { fetchSignedInStaffMember, signIn, signOut } from '@/api/session';
import type { StaffMember } from '@/domain/staffMember';

import { queryKeys } from './keys';

export const signedInStaffMemberQuery = queryOptions({
  queryKey: queryKeys.signedInStaffMember,
  queryFn: async (): Promise<StaffMember | null> => {
    try {
      return await fetchSignedInStaffMember();
    } catch (failure) {
      if (isUnauthenticated(failure)) {
        return null;
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

export function useSignedInStaffMember() {
  return useQuery(signedInStaffMemberQuery);
}

/**
 * A successful sign-in writes the Staff member straight into the cache rather
 * than invalidating it: the response body *is* `GET /me`'s (`API.md`), so a
 * second request would ask a question that has just been answered.
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: Credentials) => signIn(credentials),
    onSuccess: (staffMember) => {
      queryClient.setQueryData(queryKeys.signedInStaffMember, staffMember);
    },
  });
}

/**
 * Signing out clears the whole cache, not only the session entry: the four
 * dashboard queries hold Applicants' personal data, and leaving them in
 * memory would let the next sign-in — possibly another Staff member on a
 * shared machine — see the previous one's list for as long as the refetch
 * takes.
 *
 * The cookie is cleared by the response, so the request is sent even when it
 * fails; a Staff member who pressed "Abmelden" is signed out of the
 * dashboard either way, and the stale cookie is refused by the next request.
 *
 * Clearing while the screens are still mounted re-creates their queries, so
 * the browser console shows a short burst of `401`s on the way out. They
 * change nothing a Staff member sees — the sign-in screen is already up by
 * the time they answer — and recognising `UNAUTHENTICATED` once, at the
 * `QueryClient`, is issue #40. Doing it here instead would have signing out
 * decide what an expired Sign-in does.
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
