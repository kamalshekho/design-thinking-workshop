/**
 * The Owners an Application can be assigned to. Five rows that change when
 * the association hires a volunteer coordinator, which is to say almost
 * never — but it is server state like any other, so it lives in the same
 * cache rather than in a module constant.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import { fetchStaffMembers } from '@/api/staffMembers';
import type { Owner } from '@/domain/application';

import { queryKeys } from './keys';

export const staffMembersQuery = queryOptions({
  queryKey: queryKeys.staffMembers,
  queryFn: () => fetchStaffMembers(),
});

const NO_OWNERS: readonly Owner[] = [];

/** The list a container hands its screen; see `useApplications` on the fallback. */
export function useOwners(): readonly Owner[] {
  return useQuery(staffMembersQuery).data ?? NO_OWNERS;
}
