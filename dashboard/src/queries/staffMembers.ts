/**
 * The Owners an Application can be assigned to. Five rows that change when
 * the association hires a volunteer coordinator, which is to say almost
 * never — but it is server state like any other, so it lives in the same
 * cache rather than in a module constant.
 */

import { queryOptions } from '@tanstack/react-query';

import { fetchStaffMembers } from '@/api/staffMembers';

import { queryKeys } from './keys';

export const staffMembersQuery = queryOptions({
  queryKey: queryKeys.staffMembers,
  queryFn: () => fetchStaffMembers(),
});
