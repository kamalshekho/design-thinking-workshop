/**
 * The Staff members an Application can be assigned to (`API.md`,
 * "GET /api/v1/staff/members").
 *
 * Names and ids, no addresses: the Owner selector and the Owner filter show
 * names, and an address per row would spread personal data further than
 * either screen needs. No photos either — every Owner renders as initials.
 */

import * as z from 'zod/v4-mini';

import type { Owner } from '@/domain/application';

import { request } from './transport';

const staffMemberWireSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const staffMembersResponseSchema = z.object({
  members: z.array(staffMemberWireSchema),
});

export async function fetchStaffMembers(): Promise<Owner[]> {
  const { members } = await request(
    'GET',
    '/members',
    staffMembersResponseSchema,
  );

  return members;
}
