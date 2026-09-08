/**
 * The Staff members an Application can be assigned to (`API.md`,
 * "GET /api/v1/staff/members").
 *
 * Names and ids, no addresses: the Owner selector and the Owner filter show
 * names, and an address per row would spread personal data further than
 * either screen needs. No photos either — every Owner renders as initials.
 */

import type { Owner } from '@/domain/application';

import { request } from './transport';

type StaffMemberWire = {
  id: string;
  name: string;
};

export async function fetchStaffMembers(): Promise<Owner[]> {
  const { members } = await request<{ members: StaffMemberWire[] }>(
    'GET',
    '/members',
  );

  return members.map((member) => ({ id: member.id, name: member.name }));
}
