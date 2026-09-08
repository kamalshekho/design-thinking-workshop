/**
 * The signed-in Staff member. Mock data, like `mockApplications.ts` — there is
 * no authentication yet, and issue #16 owns the backend contract that will say
 * who is signed in.
 */

import type { StaffMember } from '@/domain/staffMember';
import ashtonBlackwell from '@/images/ashton-blackwell.webp';

/** The same Staff member `mockOwners` calls `staff-1`. */
export const currentStaffMember: StaffMember = {
  id: 'staff-1',
  name: 'Ashton Blackwell',
  email: 'ashton.blackwell@ichbinhier.online',
  avatar: ashtonBlackwell,
};
