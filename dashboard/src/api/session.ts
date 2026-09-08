/**
 * The Sign-in (`API.md`, "Sign-in and staff members").
 *
 * Three requests, and none of them touches a token: the Sign-in is a
 * `HttpOnly` cookie the browser stores and replays, which is why
 * `EventSource` can carry it and why there is nothing here to keep in
 * `localStorage`. `me` is what the dashboard asks on boot — the cookie is
 * unreadable from script, so whether a Sign-in exists is a question only the
 * backend can answer.
 *
 * `fetchSignedInStaffMember` throws `UNAUTHENTICATED` when there is no
 * Sign-in, exactly as the wire does. Turning that into "nobody is signed in"
 * is the session query's job (`src/queries/session.ts`) — this layer stays
 * faithful to the response.
 */

import type { StaffMember } from '@/domain/staffMember';

import { request, requestNoContent } from './transport';

export type Credentials = {
  email: string;
  password: string;
};

/**
 * `GET /me`'s body, which `POST /session` answers with too. No `avatar`: the
 * dashboard renders initials and photo upload is not a feature of any screen
 * (`API.md`).
 */
type StaffMemberWire = {
  id: string;
  name: string;
  email: string;
};

function toStaffMember(wire: StaffMemberWire): StaffMember {
  return { id: wire.id, name: wire.name, email: wire.email };
}

export async function fetchSignedInStaffMember(): Promise<StaffMember> {
  return toStaffMember(await request<StaffMemberWire>('GET', '/me'));
}

/**
 * `401 INVALID_CREDENTIALS` for a wrong password and for an address no
 * account has alike, and `429 RATE_LIMITED` with a `Retry-After` after five
 * failures from one address inside fifteen minutes (`A20`). The screen words
 * whichever arrives; it may not answer "is this address registered?".
 */
export async function signIn(credentials: Credentials): Promise<StaffMember> {
  return toStaffMember(
    await request<StaffMemberWire>('POST', '/session', credentials),
  );
}

/** `204`, and `204` again when there was no Sign-in to end. */
export async function signOut(): Promise<void> {
  await requestNoContent('DELETE', '/session');
}
